import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { corsMiddleware } from './middleware/cors';
import auth from './routes/auth';
import user from './routes/user';
import proxy from './routes/proxy';
import ai from './routes/ai';
import timelines from './routes/timelines';
import jobs from './routes/jobs';
import { env } from './lib/env';
import { startImageWorker, stopImageWorker } from './services/imageWorker';
import { closeQueue } from './lib/queue';
import { cleanupSessions } from './services/token';

const app = new Hono();

// Global middleware — CORS must run first so error responses include CORS headers
app.use('*', corsMiddleware);
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', bodyLimit({ maxSize: 5 * 1024 * 1024 })); // 5 MB (routes like /ai enforce tighter limits)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes — more-specific prefixes first to avoid middleware leaking
app.route('/auth', auth);
app.route('/me', user);
app.route('/api/timelines', timelines);
app.route('/api/jobs', jobs);
app.route('/api', proxy);
app.route('/ai', ai);

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Start server
console.log(`Starting server on port ${env.PORT}...`);
const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server running at http://localhost:${env.PORT}`);

// Start background worker (no-op if Redis is not configured)
startImageWorker();

// Session garbage collection — run on startup, then every 6 hours
cleanupSessions()
  .then((n) => n > 0 && console.log(`[GC] Cleaned up ${n} expired sessions`))
  .catch((err) => console.error('[GC] Session cleanup failed:', err));

const sessionGcInterval = setInterval(() => {
  cleanupSessions()
    .then((n) => n > 0 && console.log(`[GC] Cleaned up ${n} expired sessions`))
    .catch((err) => console.error('[GC] Session cleanup failed:', err));
}, 6 * 60 * 60 * 1000);
sessionGcInterval.unref();

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  await stopImageWorker();
  await closeQueue();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
