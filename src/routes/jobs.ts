import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { mediaRateLimiter } from '../middleware/ratelimit';
import { quotaMiddleware } from '../middleware/quota';
import { getImageQueue } from '../lib/queue';
import { processImageGeneration, type ImageJobData } from '../services/imageWorker';
import { db } from '../db/client';
import { timelines, timelineNodes } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const MAX_PROMPT_LENGTH = 10_000;

const jobs = new Hono();

jobs.use('/images/*', authMiddleware);
jobs.use('/images/*', mediaRateLimiter);
jobs.use('/images/*', quotaMiddleware);

// POST /images/generate — Submit image generation job
jobs.post('/images/generate', async (c) => {
  try {
    const { sub: userId } = c.get('user');
    const body = await c.req.json<{
      nodeId: string;
      timelineId: string;
      prompt: string;
    }>();

    // Validate required fields
    if (!body.nodeId || typeof body.nodeId !== 'string') {
      return c.json({ error: 'nodeId is required' }, 400);
    }
    if (!body.timelineId || typeof body.timelineId !== 'string') {
      return c.json({ error: 'timelineId is required' }, 400);
    }
    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return c.json({ error: 'prompt is required and must be a non-empty string' }, 400);
    }

    const prompt = body.prompt.trim();
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, 400);
    }

    // Verify timeline ownership
    const timeline = await db.query.timelines.findFirst({
      where: and(eq(timelines.id, body.timelineId), eq(timelines.userId, userId)),
    });
    if (!timeline) {
      return c.json({ error: 'Timeline not found' }, 404);
    }

    // Check if node already has an image
    const node = await db.query.timelineNodes.findFirst({
      where: and(
        eq(timelineNodes.id, body.nodeId),
        eq(timelineNodes.timelineId, body.timelineId),
      ),
      columns: { id: true, imageUrl: true },
    });
    if (!node) {
      return c.json({ error: 'Node not found' }, 404);
    }
    if (node.imageUrl) {
      return c.json({ status: 'already_exists', nodeId: body.nodeId });
    }

    const jobData: ImageJobData = {
      nodeId: body.nodeId,
      timelineId: body.timelineId,
      prompt,
      userId,
    };

    // Try async queue first, fall back to sync
    const queue = getImageQueue();
    if (queue) {
      const job = await queue.add('generate-image', jobData);
      return c.json({ jobId: job.id, nodeId: body.nodeId, status: 'queued' });
    }

    // Sync fallback — no Redis
    await processImageGeneration(jobData);
    return c.json({ status: 'completed', nodeId: body.nodeId });
  } catch (error) {
    console.error('[Jobs] Image generation error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      500
    );
  }
});

// GET /images/jobs/:jobId — Poll job status
jobs.get('/images/jobs/:jobId', authMiddleware, async (c) => {
  try {
    const { jobId } = c.req.param();

    const queue = getImageQueue();
    if (!queue) {
      return c.json({ error: 'Job queue not available' }, 503);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const state = await job.getState();

    const response: Record<string, unknown> = {
      jobId: job.id,
      nodeId: job.data.nodeId,
      status: state,
    };

    if (state === 'failed') {
      response.error = job.failedReason ?? 'Unknown error';
    }

    return c.json(response);
  } catch (error) {
    console.error('[Jobs] Poll error:', error);
    return c.json({ error: 'Failed to check job status' }, 500);
  }
});

export default jobs;
