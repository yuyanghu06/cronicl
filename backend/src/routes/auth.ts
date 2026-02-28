import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { db } from '../db/client';
import { users, authEvents, oauthIdentities } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '../lib/env';
import {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
} from '../services/token';
import { hashToken, generateSecureToken } from '../lib/hash';
import {
  buildAuthorizationURL,
  exchangeCodeForTokens,
  getUserInfo,
} from '../services/oauth';
import { authRateLimiter } from '../middleware/ratelimit';

const auth = new Hono();

auth.use('*', authRateLimiter);

// OAuth login — redirect to Railway
auth.get('/login', async (c) => {
  try {
    const state = generateSecureToken();

    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 10,
      path: '/',
    });

    const authUrl = buildAuthorizationURL(state);
    return c.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login error:', error);
    return c.json({ error: 'OAuth not configured' }, 503);
  }
});

// OAuth callback — exchange code, find/create user, issue tokens
auth.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  deleteCookie(c, 'oauth_state');

  if (!code || !state || !storedState || state !== storedState) {
    return c.redirect(`${env.FRONTEND_URL}/auth/error?reason=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token);

    // Find existing OAuth identity
    const existingIdentity = await db.query.oauthIdentities.findFirst({
      where: and(
        eq(oauthIdentities.provider, 'railway'),
        eq(oauthIdentities.providerSub, userInfo.sub)
      ),
    });

    let userId: string;

    if (existingIdentity) {
      // Returning user — update profile
      userId = existingIdentity.userId;
      await db
        .update(users)
        .set({
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // Check if user with this email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userInfo.email),
      });

      if (existingUser) {
        // Link OAuth identity to existing user
        userId = existingUser.id;
        await db.insert(oauthIdentities).values({
          userId,
          provider: 'railway',
          providerSub: userInfo.sub,
        });
        await db
          .update(users)
          .set({
            name: userInfo.name ?? existingUser.name,
            avatarUrl: userInfo.avatar_url ?? existingUser.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        // Create new user + link identity
        const [newUser] = await db
          .insert(users)
          .values({
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.avatar_url,
          })
          .returning();

        userId = newUser.id;

        await db.insert(oauthIdentities).values({
          userId,
          provider: 'railway',
          providerSub: userInfo.sub,
        });
      }
    }

    // Issue tokens
    const accessToken = await createAccessToken({
      sub: userId,
      email: userInfo.email,
    });
    const refreshToken = await createRefreshToken(userId);

    // Log login event
    await db.insert(authEvents).values({
      userId,
      eventType: 'oauth_login',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    // Set refresh token cookie
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Redirect to frontend with access token
    const redirectUrl = new URL('/auth/callback', env.FRONTEND_URL);
    redirectUrl.searchParams.set('access_token', accessToken);
    return c.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(`${env.FRONTEND_URL}/auth/error?reason=exchange_failed`);
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
