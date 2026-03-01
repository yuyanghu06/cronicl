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

// POST /images/generate-batch — Submit image generation for multiple nodes
jobs.post('/images/generate-batch', async (c) => {
  try {
    const { sub: userId } = c.get('user');
    const body = await c.req.json<{
      timelineId: string;
      nodeIds: string[];
    }>();

    if (!body.timelineId || typeof body.timelineId !== 'string') {
      return c.json({ error: 'timelineId is required' }, 400);
    }
    if (!Array.isArray(body.nodeIds) || body.nodeIds.length === 0) {
      return c.json({ error: 'nodeIds must be a non-empty array' }, 400);
    }
    if (body.nodeIds.length > 50) {
      return c.json({ error: 'Maximum 50 nodes per batch' }, 400);
    }

    // Verify timeline ownership
    const timeline = await db.query.timelines.findFirst({
      where: and(eq(timelines.id, body.timelineId), eq(timelines.userId, userId)),
    });
    if (!timeline) {
      return c.json({ error: 'Timeline not found' }, 404);
    }

    // Load all requested nodes
    const allNodes = await db.query.timelineNodes.findMany({
      where: eq(timelineNodes.timelineId, body.timelineId),
      columns: { id: true, title: true, content: true, imageUrl: true },
    });
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    const results: { nodeId: string; jobId?: string; status: string; error?: string }[] = [];
    const queue = getImageQueue();

    for (const nodeId of body.nodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        results.push({ nodeId, status: 'skipped', error: 'Node not found' });
        continue;
      }
      if (node.imageUrl) {
        results.push({ nodeId, status: 'already_exists' });
        continue;
      }

      const prompt = [node.title, node.content].filter(Boolean).join(' — ') || 'A cinematic storyboard frame';
      const jobData: ImageJobData = {
        nodeId,
        timelineId: body.timelineId,
        prompt,
        userId,
      };

      if (queue) {
        const job = await queue.add('generate-image', jobData);
        results.push({ nodeId, jobId: job.id, status: 'queued' });
      } else {
        // Sync fallback — fire concurrently (capped at 5)
        results.push({ nodeId, status: 'processing' });
      }
    }

    // Sync fallback: run all jobs concurrently with concurrency cap
    if (!queue) {
      const toProcess = body.nodeIds
        .filter((id) => results.find((r) => r.nodeId === id)?.status === 'processing')
        .map((nodeId) => {
          const node = nodeMap.get(nodeId)!;
          const prompt = [node.title, node.content].filter(Boolean).join(' — ') || 'A cinematic storyboard frame';
          return { nodeId, timelineId: body.timelineId, prompt, userId } as ImageJobData;
        });

      const SYNC_CONCURRENCY = 5;
      const settled: PromiseSettledResult<void>[] = [];
      for (let i = 0; i < toProcess.length; i += SYNC_CONCURRENCY) {
        const batch = toProcess.slice(i, i + SYNC_CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((data) => processImageGeneration(data))
        );
        settled.push(...batchResults);
      }

      // Update result statuses
      toProcess.forEach((data, idx) => {
        const r = results.find((r) => r.nodeId === data.nodeId);
        if (r) {
          r.status = settled[idx].status === 'fulfilled' ? 'completed' : 'failed';
          if (settled[idx].status === 'rejected') {
            r.error = (settled[idx] as PromiseRejectedResult).reason?.message ?? 'Unknown error';
          }
        }
      });
    }

    return c.json({ jobs: results });
  } catch (error) {
    console.error('[Jobs] Batch image generation error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Batch image generation failed' },
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
