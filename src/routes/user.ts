import { Hono } from 'hono';

const user = new Hono();

// Demo user endpoint - returns static demo user
user.get('/', (c) => {
  return c.json({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@example.com',
    name: 'Demo User',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  });
});

// Demo usage endpoint - returns unlimited usage
user.get('/usage/current', (c) => {
  return c.json({
    daily: { used: 0, limit: 999999, remaining: 999999 },
    monthly: { used: 0, limit: 999999, remaining: 999999 },
  });
});

export default user;
