import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

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

export default user;
