import type { Context, Next } from 'hono';
import { verifyAccessToken, type JWTPayload } from '../services/token';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';
let devUserSeeded = false;

async function ensureDevUser() {
  if (devUserSeeded) return;
  const existing = await db.query.users.findFirst({
    where: eq(users.id, DEV_USER_ID),
  });
  if (!existing) {
    await db.insert(users).values({
      id: DEV_USER_ID,
      email: 'dev@localhost',
      name: 'Dev User',
    });
  }
  devUserSeeded = true;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  // Dev bypass: skip auth in non-production when no token provided
  if (process.env.NODE_ENV !== 'production' && !authHeader) {
    await ensureDevUser();
    c.set('user', { sub: DEV_USER_ID, email: 'dev@localhost' } as JWTPayload);
    await next();
    return;
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
