import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { db } from '../db/client';
import { users, authEvents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../lib/env';
import {
  createAccessToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
} from '../services/token';
import { hashToken } from '../lib/hash';

const auth = new Hono();

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
