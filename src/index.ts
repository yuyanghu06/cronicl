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
import { env } from './lib/env';

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

// Graceful shutdown
function shutdown() {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
