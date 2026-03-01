import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { mediaRateLimiter } from '../middleware/ratelimit';
import { quotaMiddleware } from '../middleware/quota';
import { generateText, generateImage, generateStructuredText, type GenerateTextRequest, type GenerateImageRequest } from '../services/ai';
import { recordUsage } from '../services/usage';
import { db } from '../db/client';
import { timelines } from '../db/schema';
import { eq } from 'drizzle-orm';

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

    // Preserve original scene text for character extraction (before style enrichment)
    const sceneText = prompt;

    // Enrich prompt with timeline creative context when available
    if (body.timelineId) {
      const timeline = await db.query.timelines.findFirst({
        where: eq(timelines.id, body.timelineId),
        columns: { visualTheme: true, systemPrompt: true },
      });
      if (timeline?.visualTheme) {
        prompt = `You are generating a storyboard frame for a cinematic narrative.

VISUAL STYLE GUIDE:
${timeline.visualTheme}

SCENE:
${prompt}

Generate an image that strictly follows the visual style guide above.`;
      } else if (timeline?.systemPrompt) {
        prompt = `You are generating a storyboard frame for a cinematic narrative.

CREATIVE DIRECTION:
${timeline.systemPrompt}

SCENE:
${prompt}

Generate a visually striking image that matches the genre, tone, and world described above.`;
      }
    }

    // Extract characters from scene text for consistent storyboard depiction
    try {
      const extraction = await generateStructuredText<{ characters: string[] }>({
        prompt: `Extract the names of all characters (people, named entities) who are physically present or actively participating in this scene. Return ONLY characters who appear in the text. If no characters are mentioned, return an empty array.

Return JSON: {"characters": ["Name1", "Name2"]}

Scene text:
${sceneText}`,
        model: 'gemini-2.5-flash-lite',
      });
      const chars = extraction.data.characters ?? [];
      if (chars.length > 0) {
        prompt += `\n\nCHARACTERS IN THIS SCENE: ${chars.join(', ')}.\nDepict ONLY these characters. Do NOT include any other people or characters not listed above.`;
      } else {
        prompt += `\n\nNo named characters are present in this scene. Do NOT include any identifiable people or characters.`;
      }
    } catch {
      // Character extraction failed — proceed without character directives
    }

    const result = await generateImage({
      prompt,
      model: body.model,
    });

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
