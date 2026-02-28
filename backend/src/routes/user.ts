import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getUserUsage, getUserQuotaLimits } from '../services/usage';

const user = new Hono();

user.use('*', authMiddleware);

user.get('/', async (c) => {
  const { sub } = c.get('user');

  const userData = await db.query.users.findFirst({
    where: eq(users.id, sub),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(userData);
});

user.get('/usage/current', async (c) => {
  const { sub } = c.get('user');

  const [dailyUsage, monthlyUsage, limits] = await Promise.all([
    getUserUsage(sub, 'day'),
    getUserUsage(sub, 'month'),
    getUserQuotaLimits(sub),
  ]);

  return c.json({
    daily: {
      used: dailyUsage,
      limit: limits.dailyRequests,
      remaining: Math.max(0, limits.dailyRequests - dailyUsage),
    },
    monthly: {
      used: monthlyUsage,
      limit: limits.monthlyRequests,
      remaining: Math.max(0, limits.monthlyRequests - monthlyUsage),
    },
  });
});

export default user;
