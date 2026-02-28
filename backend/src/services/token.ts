import * as jose from 'jose';
import { env } from '../lib/env';
import { generateSecureToken, hashToken } from '../lib/hash';
import { db } from '../db/client';
import { refreshTokens } from '../db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface JWTPayload {
  sub: string;
  email: string;
  [key: string]: unknown;
}

export async function createAccessToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string
): Promise<string> {
  const oldHash = hashToken(oldToken);

  // Find and validate the old token
  const existing = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, oldHash),
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, new Date())
    ),
  });

  if (!existing) {
    throw new Error('Invalid or expired refresh token');
  }

  // Revoke the old token
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, existing.id));

  // Issue a new token
  return createRefreshToken(userId);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
