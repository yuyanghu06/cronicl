import { Worker } from 'bullmq';
import { getConnection } from '../lib/queue';
import { db } from '../db/client';
import { timelines, timelineNodes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateImage, generateStructuredText } from './ai';
import { recordUsage } from './usage';

export interface ImageJobData {
  nodeId: string;
  timelineId: string;
  prompt: string;
  userId: string;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function processImageGeneration(data: ImageJobData): Promise<void> {
  const { nodeId, timelineId, prompt: rawPrompt, userId } = data;

  let prompt = rawPrompt;
  const sceneText = rawPrompt;

  // Enrich prompt with timeline visual context
  const timeline = await db.query.timelines.findFirst({
    where: eq(timelines.id, timelineId),
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

  // Extract setting + characters in parallel
  const [settingResult, characterResult] = await Promise.allSettled([
    generateStructuredText<{ setting: string }>({
      prompt: `Extract the physical setting/location/environment from this scene. Describe WHERE the scene takes place in one vivid, specific sentence (e.g. "A rain-soaked neon-lit alleyway in a cyberpunk megacity at night"). If no setting is described, infer the most likely environment from context.

Return JSON: {"setting": "..."}

Scene text:
${sceneText}`,
      model: 'gemini-2.5-flash-lite',
    }),
    generateStructuredText<{ characters: string[] }>({
      prompt: `Extract the names of all characters (people, named entities) who are physically present or actively participating in this scene. Return ONLY characters who appear in the text. If no characters are mentioned, return an empty array.

Return JSON: {"characters": ["Name1", "Name2"]}

Scene text:
${sceneText}`,
      model: 'gemini-2.5-flash-lite',
    }),
  ]);

  if (settingResult.status === 'fulfilled') {
    const setting = settingResult.value.data.setting;
    if (setting) {
      prompt += `\n\nSETTING (MANDATORY — the image MUST depict this environment): ${setting}`;
    }
  }

  if (characterResult.status === 'fulfilled') {
    const chars = characterResult.value.data.characters ?? [];
    if (chars.length > 0) {
      prompt += `\n\nCHARACTERS IN THIS SCENE: ${chars.join(', ')}.\nDepict ONLY these characters. Do NOT include any other people or characters not listed above.`;
    } else {
      prompt += `\n\nNo named characters are present in this scene. Do NOT include any identifiable people or characters.`;
    }
  }

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
