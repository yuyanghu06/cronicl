import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { mediaRateLimiter } from '../middleware/ratelimit';
import { quotaMiddleware } from '../middleware/quota';
import { generateText, generateImage, generateStructuredText, type GenerateTextRequest, type GenerateImageRequest } from '../services/ai';
import { recordUsage } from '../services/usage';
import { db } from '../db/client';
import { timelines, characterBible } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  buildSettingExtractionPrompt,
  buildCharacterExtractionPrompt,
  buildImageGenerationPrompt,
  type StoryContext,
} from '../services/imagePrompts';
import { matchCharacters } from '../services/characterMatcher';

const MAX_PROMPT_LENGTH = 10_000;

const proxy = new Hono();

proxy.use('/generate/*', authMiddleware);
proxy.use('/generate/*', mediaRateLimiter);
proxy.use('/generate/*', quotaMiddleware);

proxy.post('/generate/text', async (c) => {
  try {
    const body = await c.req.json<GenerateTextRequest>();

    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    const prompt = body.prompt.trim();
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, 400);
    }

    const result = await generateText({
      prompt,
      model: body.model,
      maxTokens: body.maxTokens,
    });

    const { sub } = c.get('user');
    recordUsage(sub, '/api/generate/text').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json(result);
  } catch (error) {
    console.error('AI proxy error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      500
    );
  }
});

proxy.post('/generate/image', async (c) => {
  try {
    const body = await c.req.json<GenerateImageRequest & { timelineId?: string }>();

    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    let prompt = body.prompt.trim();
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, 400);
    }

    // Preserve original scene text for extraction (before style enrichment)
    const sceneText = prompt;

    // Load story context + character bible for grounding
    let storyContext: StoryContext = {};
    let bible: import('../db/schema').CharacterBibleEntry[] = [];
    if (body.timelineId) {
      const [timeline, bibleEntries] = await Promise.all([
        db.query.timelines.findFirst({
          where: eq(timelines.id, body.timelineId),
          columns: { visualTheme: true, systemPrompt: true, visionBlurb: true },
        }),
        db.query.characterBible.findMany({
          where: eq(characterBible.timelineId, body.timelineId),
        }),
      ]);
      if (timeline) {
        storyContext = {
          visualTheme: timeline.visualTheme,
          systemPrompt: timeline.systemPrompt,
          visionBlurb: timeline.visionBlurb,
        };
      }
      bible = bibleEntries;
    }

    // Build known character names + aliases for extraction accuracy
    const knownCharacters = bible.flatMap((entry) => [
      entry.name,
      ...(entry.aliases ?? []),
    ].filter(Boolean));

    // Extract setting and characters in parallel (grounded in story context)
    const [settingResult, characterResult] = await Promise.allSettled([
      generateStructuredText<{ setting: string }>({
        prompt: buildSettingExtractionPrompt(sceneText, storyContext),
        model: 'gemini-2.5-flash-lite',
      }),
      generateStructuredText<{ characters: string[] }>({
        prompt: buildCharacterExtractionPrompt(
          sceneText,
          storyContext,
          knownCharacters.length > 0 ? knownCharacters : undefined
        ),
        model: 'gemini-2.5-flash-lite',
      }),
    ]);

    const extracted = {
      setting: settingResult.status === 'fulfilled'
        ? settingResult.value.data.setting ?? null
        : null,
      characters: characterResult.status === 'fulfilled'
        ? characterResult.value.data.characters ?? []
        : [],
    };

    // Match extracted characters against the bible for identity injection
    const matchedCharacters = matchCharacters(extracted.characters, bible);

    // Assemble final image prompt with labeled sections and priority ordering
    prompt = buildImageGenerationPrompt(
      sceneText,
      storyContext,
      extracted,
      matchedCharacters.length > 0 ? matchedCharacters : undefined
    );

    const result = await generateImage({
      prompt,
      model: body.model,
    });

    // Validate MIME type before returning to client
    const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    if (!ALLOWED_IMAGE_TYPES.includes(result.mimeType)) {
      console.error(`[Image] Unexpected MIME type from provider: ${result.mimeType}`);
      return c.json({ error: 'Image generation returned an unsupported format' }, 502);
    }

    const { sub } = c.get('user');
    recordUsage(sub, '/api/generate/image').catch((err) =>
      console.error('Failed to record usage:', err)
    );

    return c.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      500
    );
  }
});

export default proxy;
