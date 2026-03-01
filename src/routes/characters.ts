import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/client';
import { timelines, characterBible } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateImage } from '../services/ai';
import { buildPortraitGenerationPrompt, type StoryContext } from '../services/imagePrompts';
import { uploadImage } from '../lib/r2';

const characters = new Hono<{ Variables: { user: { sub: string } } }>();

characters.use('*', authMiddleware);

// --- Ownership check helper ---

async function verifyTimelineOwnership(timelineId: string, userId: string) {
  return db.query.timelines.findFirst({
    where: and(eq(timelines.id, timelineId), eq(timelines.userId, userId)),
    columns: { id: true, visualTheme: true, systemPrompt: true, visionBlurb: true },
  });
}

// GET / — List all characters for a timeline
characters.get('/', async (c) => {
  const timelineId = c.req.param('timelineId');
  const { sub: userId } = c.get('user');

  const timeline = await verifyTimelineOwnership(timelineId, userId);
  if (!timeline) return c.json({ error: 'Timeline not found' }, 404);

  const entries = await db.query.characterBible.findMany({
    where: eq(characterBible.timelineId, timelineId),
    orderBy: (cb, { asc }) => [asc(cb.name)],
  });

  return c.json(entries);
});

// POST / — Create a character
characters.post('/', async (c) => {
  const timelineId = c.req.param('timelineId');
  const { sub: userId } = c.get('user');

  const timeline = await verifyTimelineOwnership(timelineId, userId);
  if (!timeline) return c.json({ error: 'Timeline not found' }, 404);

  const body = await c.req.json<{
    name: string;
    description?: string;
    appearanceGuide?: string;
    aliases?: string[];
  }>();

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return c.json({ error: 'name is required' }, 400);
  }

  try {
    const [entry] = await db
      .insert(characterBible)
      .values({
        timelineId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        appearanceGuide: body.appearanceGuide?.trim() || null,
        aliases: body.aliases?.map((a) => a.trim()).filter(Boolean) || null,
      })
      .returning();

    return c.json(entry, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      return c.json({ error: 'A character with this name already exists in this timeline' }, 409);
    }
    throw err;
  }
});

// PUT /:characterId — Update a character
characters.put('/:characterId', async (c) => {
  const timelineId = c.req.param('timelineId');
  const characterId = c.req.param('characterId');
  const { sub: userId } = c.get('user');

  const timeline = await verifyTimelineOwnership(timelineId, userId);
  if (!timeline) return c.json({ error: 'Timeline not found' }, 404);

  const body = await c.req.json<{
    name?: string;
    description?: string | null;
    appearanceGuide?: string | null;
    aliases?: string[] | null;
  }>();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.appearanceGuide !== undefined) updates.appearanceGuide = body.appearanceGuide?.trim() || null;
  if (body.aliases !== undefined) updates.aliases = body.aliases?.map((a) => a.trim()).filter(Boolean) || null;

  const [updated] = await db
    .update(characterBible)
    .set(updates)
    .where(and(eq(characterBible.id, characterId), eq(characterBible.timelineId, timelineId)))
    .returning();

  if (!updated) return c.json({ error: 'Character not found' }, 404);

  return c.json(updated);
});

// DELETE /:characterId — Delete a character
characters.delete('/:characterId', async (c) => {
  const timelineId = c.req.param('timelineId');
  const characterId = c.req.param('characterId');
  const { sub: userId } = c.get('user');

  const timeline = await verifyTimelineOwnership(timelineId, userId);
  if (!timeline) return c.json({ error: 'Timeline not found' }, 404);

  const [deleted] = await db
    .delete(characterBible)
    .where(and(eq(characterBible.id, characterId), eq(characterBible.timelineId, timelineId)))
    .returning({ id: characterBible.id });

  if (!deleted) return c.json({ error: 'Character not found' }, 404);

  return c.json({ success: true });
});

// POST /:characterId/generate-portrait — Generate a reference portrait
characters.post('/:characterId/generate-portrait', async (c) => {
  const timelineId = c.req.param('timelineId');
  const characterId = c.req.param('characterId');
  const { sub: userId } = c.get('user');

  const timeline = await verifyTimelineOwnership(timelineId, userId);
  if (!timeline) return c.json({ error: 'Timeline not found' }, 404);

  const character = await db.query.characterBible.findFirst({
    where: and(eq(characterBible.id, characterId), eq(characterBible.timelineId, timelineId)),
  });

  if (!character) return c.json({ error: 'Character not found' }, 404);
  if (!character.appearanceGuide) {
    return c.json({ error: 'Character must have an appearance guide before generating a portrait' }, 400);
  }

  const storyContext: StoryContext = {
    visualTheme: timeline.visualTheme,
    systemPrompt: timeline.systemPrompt,
    visionBlurb: timeline.visionBlurb,
  };

  const prompt = buildPortraitGenerationPrompt(
    { name: character.name, appearanceGuide: character.appearanceGuide },
    storyContext
  );

  const result = await generateImage({ prompt });

  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  if (!ALLOWED_IMAGE_TYPES.includes(result.mimeType)) {
    return c.json({ error: 'Portrait generation returned an unsupported format' }, 502);
  }

  const imageUrl =
    (await uploadImage(result.image, result.mimeType, 'portraits')) ??
    `data:${result.mimeType};base64,${result.image}`;

  const [updated] = await db
    .update(characterBible)
    .set({ referenceImageUrl: imageUrl, updatedAt: new Date() })
    .where(and(eq(characterBible.id, characterId), eq(characterBible.timelineId, timelineId)))
    .returning();

  return c.json(updated);
});

export default characters;
