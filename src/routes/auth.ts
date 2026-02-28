import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'crypto';
import { db } from '../db/client';
import { users, oauthIdentities, authEvents } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '../lib/env';
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from '../services/google';
import {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
} from '../services/token';
import { hashToken } from '../lib/hash';

const auth = new Hono();

// Start Google OAuth flow
auth.get('/google/start', (c) => {
  const state = randomBytes(16).toString('hex');
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const authUrl = getGoogleAuthUrl(state);
  return c.redirect(authUrl);
});

// Google OAuth callback
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  deleteCookie(c, 'oauth_state');

  if (!code || !state || state !== storedState) {
    return c.redirect(`${env.FRONTEND_URL}?error=invalid_state`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Find or create user
    let existingIdentity = await db.query.oauthIdentities.findFirst({
      where: and(
        eq(oauthIdentities.provider, 'google'),
        eq(oauthIdentities.providerSub, googleUser.sub)
      ),
    });

    let userId: string;

    if (existingIdentity) {
      userId = existingIdentity.userId;
      // Update user info
      await db
        .update(users)
        .set({
          name: googleUser.name,
          avatarUrl: googleUser.picture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // Check if email already exists
      let existingUser = await db.query.users.findFirst({
        where: eq(users.email, googleUser.email),
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
          })
          .returning();
        userId = newUser.id;
      }

      // Link OAuth identity
      await db.insert(oauthIdentities).values({
        userId,
        provider: 'google',
        providerSub: googleUser.sub,
      });
    }

    // Get user for token payload
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create tokens
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = await createRefreshToken(user.id);

    // Log auth event
    await db.insert(authEvents).values({
      userId: user.id,
      eventType: 'login',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    // Set refresh token as httpOnly cookie
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Redirect to frontend with access token
    return c.redirect(`${env.FRONTEND_URL}/home?token=${accessToken}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }
});

// Refresh access token
auth.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (!refreshToken) {
    return c.json({ error: 'No refresh token' }, 401);
  }

  try {
    // Get user from old refresh token to validate
    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: eq(
        (await import('../db/schema')).refreshTokens.tokenHash,
        tokenHash
      ),
    });

    if (!tokenRecord || tokenRecord.revokedAt) {
      deleteCookie(c, 'refresh_token');
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, tokenRecord.userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Rotate refresh token
    const newRefreshToken = await rotateRefreshToken(refreshToken, user.id);

    // Create new access token
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
    });

    // Log refresh event
    await db.insert(authEvents).values({
      userId: user.id,
      eventType: 'refresh',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    // Set new refresh token cookie
    setCookie(c, 'refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return c.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    deleteCookie(c, 'refresh_token');
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

// Logout
auth.post('/logout', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');
  const authHeader = c.req.header('Authorization');

  let userId: string | null = null;

  // Try to get user ID from access token
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = await verifyAccessToken(authHeader.slice(7));
      userId = payload.sub;
    } catch {
      // Token might be expired, that's okay
    }
  }

  // Revoke refresh token if present
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);

    // If we don't have userId from access token, get it from refresh token
    if (!userId) {
      const tokenHash = hashToken(refreshToken);
      const tokenRecord = await db.query.refreshTokens.findFirst({
        where: eq(
          (await import('../db/schema')).refreshTokens.tokenHash,
          tokenHash
        ),
      });
      if (tokenRecord) {
        userId = tokenRecord.userId;
      }
    }
  }

  deleteCookie(c, 'refresh_token');

  // Log logout event
  if (userId) {
    await db.insert(authEvents).values({
      userId,
      eventType: 'logout',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });
  }

  return c.json({ success: true });
});

export default auth;
