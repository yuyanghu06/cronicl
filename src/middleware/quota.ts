import type { Context, Next } from 'hono';
import { getUserUsage, getUserQuotaLimits } from '../services/usage';

export async function quotaMiddleware(c: Context, next: Next) {
  const user = c.get('user');

  if (!user?.sub) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = user.sub;

  const [dailyUsage, monthlyUsage, limits] = await Promise.all([
    getUserUsage(userId, 'day'),
    getUserUsage(userId, 'month'),
    getUserQuotaLimits(userId),
  ]);

  // Set rate limit headers on all responses
  c.header('x-ratelimit-limit-daily', String(limits.dailyRequests));
  c.header('x-ratelimit-remaining-daily', String(Math.max(0, limits.dailyRequests - dailyUsage)));
  c.header('x-ratelimit-limit-monthly', String(limits.monthlyRequests));
  c.header('x-ratelimit-remaining-monthly', String(Math.max(0, limits.monthlyRequests - monthlyUsage)));

  if (dailyUsage >= limits.dailyRequests) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return c.json(
      {
        error: 'Daily request limit exceeded',
        limit: limits.dailyRequests,
        used: dailyUsage,
        period: 'day',
        resetsAt: tomorrow.toISOString(),
      },
      429
    );
  }

  if (monthlyUsage >= limits.monthlyRequests) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    return c.json(
      {
        error: 'Monthly request limit exceeded',
        limit: limits.monthlyRequests,
        used: monthlyUsage,
        period: 'month',
        resetsAt: nextMonth.toISOString(),
      },
      429
    );
  }

  await next();
}
