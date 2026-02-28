import type { Context, Next } from 'hono';

// Sliding window log rate limiter — in-memory, no deps
const windows = new Map<string, number[]>();

function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  keyFn: (c: Context) => string;
}) {
  return async (c: Context, next: Next) => {
    const key = opts.keyFn(c);
    const now = Date.now();
    const cutoff = now - opts.windowMs;

    let timestamps = windows.get(key);
    if (timestamps) {
      // Remove expired entries
      timestamps = timestamps.filter((t) => t > cutoff);
    } else {
      timestamps = [];
    }

    if (timestamps.length >= opts.limit) {
      const oldest = timestamps[0];
      const retryAfter = Math.ceil((oldest + opts.windowMs - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests' }, 429);
    }

    timestamps.push(now);
    windows.set(key, timestamps);

    await next();
  };
}

// --- Key extractors ---

function ipKey(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

function userKey(c: Context): string {
  try {
    const user = c.get('user') as { sub: string } | undefined;
    return user?.sub ?? ipKey(c);
  } catch {
    return ipKey(c);
  }
}

// --- Exported instances ---

/** 5 requests per minute, keyed by IP */
export const authRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
  keyFn: (c) => `auth:${ipKey(c)}`,
});

/** 30 requests per minute, keyed by user ID */
export const aiRateLimiter = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  keyFn: (c) => `ai:${userKey(c)}`,
});

/** 10 requests per minute, keyed by user ID */
export const mediaRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  keyFn: (c) => `media:${userKey(c)}`,
});

// --- Cleanup stale entries every 60s ---

const cleanupInterval = setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, filtered);
    }
  }
}, 60_000);

cleanupInterval.unref();
