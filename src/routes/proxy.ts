import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { mediaRateLimiter } from '../middleware/ratelimit';
import { quotaMiddleware } from '../middleware/quota';
import { generateText, generateImage, type GenerateTextRequest, type GenerateImageRequest } from '../services/ai';
import { recordUsage } from '../services/usage';

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
    const body = await c.req.json<GenerateImageRequest>();

    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    const prompt = body.prompt.trim();
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, 400);
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
