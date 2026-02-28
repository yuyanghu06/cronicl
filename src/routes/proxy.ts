import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generateText, generateImage, type GenerateTextRequest, type GenerateImageRequest } from '../services/ai';

const proxy = new Hono();

proxy.use('*', authMiddleware);

proxy.post('/generate/text', async (c) => {
  try {
    const body = await c.req.json<GenerateTextRequest>();

    if (!body.prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const result = await generateText({
      prompt: body.prompt,
      model: body.model,
      maxTokens: body.maxTokens,
    });

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

    if (!body.prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const result = await generateImage({
      prompt: body.prompt,
      model: body.model,
    });

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
