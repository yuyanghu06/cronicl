import { cors } from 'hono/cors';
import { env } from '../lib/env';

// Ensure FRONTEND_URL includes protocol
const frontendUrl = env.FRONTEND_URL?.startsWith('http')
  ? env.FRONTEND_URL
  : env.FRONTEND_URL
    ? `https://${env.FRONTEND_URL}`
    : undefined;

const allowedOrigins = [
  frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return allowedOrigins[0];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
