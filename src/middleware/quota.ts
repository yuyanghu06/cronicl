import type { Context, Next } from 'hono';

// Demo mode - no quota limits
export async function quotaMiddleware(c: Context, next: Next) {
  c.header('x-ratelimit-limit-daily', '999999');
  c.header('x-ratelimit-remaining-daily', '999999');
  c.header('x-ratelimit-limit-monthly', '999999');
  c.header('x-ratelimit-remaining-monthly', '999999');
  await next();
}
