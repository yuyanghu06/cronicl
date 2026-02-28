import type { Context, Next } from 'hono';

// Demo user for public access (valid UUID format)
const DEMO_USER = {
  sub: '00000000-0000-0000-0000-000000000000',
  email: 'demo@example.com',
};

declare module 'hono' {
  interface ContextVariableMap {
    user: typeof DEMO_USER;
  }
}

// No-op middleware that sets a demo user for all requests
export async function authMiddleware(c: Context, next: Next) {
  c.set('user', DEMO_USER);
  await next();
}
