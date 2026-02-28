import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { validateSession, type SessionUser } from '../services/token';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser;
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
  const sessionToken = getCookie(c, 'session');

  // Dev bypass: skip auth in non-production when no session cookie
  if (process.env.NODE_ENV !== 'production' && !sessionToken) {
    await ensureDevUser();
    c.set('user', { sub: DEV_USER_ID, email: 'dev@localhost' } as SessionUser);
    await next();
    return;
  }

  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  c.set('user', { sub: user.id, email: user.email } as SessionUser);
  await next();
}
