import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/client';
import { users, creatorProfiles } from '../db/schema';
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

// --- Creator Profile CRUD ---

const PROFILE_DEFAULTS = {
  stylePreferences: [] as string[],
  favoriteThemes: [] as string[],
  preferredTone: '',
  explorationRatio: 0.3,
  dislikedElements: [] as string[],
};

user.get('/profile', async (c) => {
  const { sub } = c.get('user');

  const profile = await db.query.creatorProfiles.findFirst({
    where: eq(creatorProfiles.userId, sub),
  });

  if (!profile) {
    return c.json(PROFILE_DEFAULTS);
  }

  return c.json({
    stylePreferences: profile.stylePreferences ?? [],
    favoriteThemes: profile.favoriteThemes ?? [],
    preferredTone: profile.preferredTone ?? '',
    explorationRatio: profile.explorationRatio ? parseFloat(profile.explorationRatio) : 0.3,
    dislikedElements: profile.dislikedElements ?? [],
  });
});

user.put('/profile', async (c) => {
  const { sub } = c.get('user');
  const body = await c.req.json();

  // Validate array fields
  const arrayFields = ['stylePreferences', 'favoriteThemes', 'dislikedElements'] as const;
  for (const field of arrayFields) {
    if (body[field] !== undefined) {
      if (!Array.isArray(body[field]) || !body[field].every((v: unknown) => typeof v === 'string')) {
        return c.json({ error: `${field} must be an array of strings` }, 400);
      }
    }
  }

  // Validate preferredTone
  if (body.preferredTone !== undefined && typeof body.preferredTone !== 'string') {
    return c.json({ error: 'preferredTone must be a string' }, 400);
  }

  // Validate and clamp explorationRatio
  let explorationRatio: string | undefined;
  if (body.explorationRatio !== undefined) {
    const ratio = Number(body.explorationRatio);
    if (isNaN(ratio)) {
      return c.json({ error: 'explorationRatio must be a number between 0.0 and 1.0' }, 400);
    }
    explorationRatio = String(Math.max(0, Math.min(1, ratio)));
  }

  const values: Record<string, unknown> = { userId: sub, updatedAt: new Date() };
  if (body.stylePreferences !== undefined) values.stylePreferences = body.stylePreferences;
  if (body.favoriteThemes !== undefined) values.favoriteThemes = body.favoriteThemes;
  if (body.preferredTone !== undefined) values.preferredTone = body.preferredTone;
  if (explorationRatio !== undefined) values.explorationRatio = explorationRatio;
  if (body.dislikedElements !== undefined) values.dislikedElements = body.dislikedElements;

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (body.stylePreferences !== undefined) updateFields.stylePreferences = body.stylePreferences;
  if (body.favoriteThemes !== undefined) updateFields.favoriteThemes = body.favoriteThemes;
  if (body.preferredTone !== undefined) updateFields.preferredTone = body.preferredTone;
  if (explorationRatio !== undefined) updateFields.explorationRatio = explorationRatio;
  if (body.dislikedElements !== undefined) updateFields.dislikedElements = body.dislikedElements;

  await db
    .insert(creatorProfiles)
    .values(values as typeof creatorProfiles.$inferInsert)
    .onConflictDoUpdate({
      target: creatorProfiles.userId,
      set: updateFields,
    });

  // Return the updated profile
  const updated = await db.query.creatorProfiles.findFirst({
    where: eq(creatorProfiles.userId, sub),
  });

  return c.json({
    stylePreferences: updated?.stylePreferences ?? [],
    favoriteThemes: updated?.favoriteThemes ?? [],
    preferredTone: updated?.preferredTone ?? '',
    explorationRatio: updated?.explorationRatio ? parseFloat(updated.explorationRatio) : 0.3,
    dislikedElements: updated?.dislikedElements ?? [],
  });
});

export default user;
