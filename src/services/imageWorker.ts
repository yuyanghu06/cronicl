import { Worker } from 'bullmq';
import { getConnection } from '../lib/queue';
import { db } from '../db/client';
import { timelines, timelineNodes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateImage, generateStructuredText } from './ai';
import { recordUsage } from './usage';
import {
  buildSettingExtractionPrompt,
  buildCharacterExtractionPrompt,
  buildImageGenerationPrompt,
  type StoryContext,
} from './imagePrompts';

export interface ImageJobData {
  nodeId: string;
  timelineId: string;
  prompt: string;
  userId: string;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function processImageGeneration(data: ImageJobData): Promise<void> {
  const { nodeId, timelineId, prompt: rawPrompt, userId } = data;

  const sceneText = rawPrompt;

  // Load story context for grounding
  const timeline = await db.query.timelines.findFirst({
    where: eq(timelines.id, timelineId),
    columns: { visualTheme: true, systemPrompt: true, visionBlurb: true },
  });

  const storyContext: StoryContext = {
    visualTheme: timeline?.visualTheme,
    systemPrompt: timeline?.systemPrompt,
    visionBlurb: timeline?.visionBlurb,
  };

  // Extract setting + characters in parallel (grounded in story context)
  const [settingResult, characterResult] = await Promise.allSettled([
    generateStructuredText<{ setting: string }>({
      prompt: buildSettingExtractionPrompt(sceneText, storyContext),
      model: 'gemini-2.5-flash-lite',
    }),
    generateStructuredText<{ characters: string[] }>({
      prompt: buildCharacterExtractionPrompt(sceneText, storyContext),
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

  // Assemble final image prompt with labeled sections and priority ordering
  const prompt = buildImageGenerationPrompt(sceneText, storyContext, extracted);

  const result = await generateImage({ prompt });

  if (!ALLOWED_IMAGE_TYPES.includes(result.mimeType)) {
    throw new Error(`Unexpected MIME type from provider: ${result.mimeType}`);
  }

  const dataUrl = `data:${result.mimeType};base64,${result.image}`;

  // Save to DB
  await db
    .update(timelineNodes)
    .set({ imageUrl: dataUrl, updatedAt: new Date() })
    .where(
      and(eq(timelineNodes.id, nodeId), eq(timelineNodes.timelineId, timelineId))
    );

  recordUsage(userId, '/api/jobs/images/generate').catch((err) =>
    console.error('Failed to record usage:', err)
  );
}

// ---------- BullMQ Worker ----------

let worker: Worker | null = null;

export function startImageWorker(): void {
  const conn = getConnection();
  if (!conn) {
    console.log('[ImageWorker] No Redis connection — worker disabled (sync fallback active)');
    return;
  }

  worker = new Worker<ImageJobData>(
    'image-generation',
    async (job) => {
      console.log(`[ImageWorker] Processing job ${job.id} for node ${job.data.nodeId}`);
      await processImageGeneration(job.data);
      console.log(`[ImageWorker] Completed job ${job.id}`);
    },
    {
      connection: conn,
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60_000,
      },
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[ImageWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[ImageWorker] Started (concurrency: 2, rate: 5/min)');
}

export async function stopImageWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[ImageWorker] Stopped');
  }
}
