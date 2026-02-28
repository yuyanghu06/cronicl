import { generateSecureToken, hashToken } from '../lib/hash';
import { db } from '../db/client';
import { refreshTokens } from '../db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

const SESSION_EXPIRY_DAYS = 7;

/** Shape injected into c.set('user', …) — unchanged from JWT era so routes need zero edits. */
export interface SessionUser {
  sub: string;
  email: string;
  [key: string]: unknown;
}

/** Create a new session row and return the raw (unhashed) token. */
export async function createSession(userId: string): Promise<string> {
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

/** Hash the raw token, look it up, return { userId } if valid, else null. */
export async function validateSession(
  token: string
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(token);

  const row = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, new Date())
    ),
  });

  if (!row) return null;
  return { userId: row.userId };
}

/** Revoke a single session by its raw token. */
export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

/** Revoke every active session for a user. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
