import { cors } from 'hono/cors';

// Allow all origins for development - restrict in production
export const corsMiddleware = cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
