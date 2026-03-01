import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

let connection: IORedis | null = null;
let imageQueue: Queue | null = null;

export function getConnection(): IORedis | null {
  if (!env.REDIS_URL) return null;
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }
  return connection;
}

export function getImageQueue(): Queue | null {
  if (!env.REDIS_URL) return null;
  if (!imageQueue) {
    const conn = getConnection();
    if (!conn) return null;
    imageQueue = new Queue('image-generation', {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 }, // prune after 1h
        removeOnFail: { age: 86400 },    // keep failed jobs 24h for debugging
      },
    });
  }
  return imageQueue;
}

export async function closeQueue(): Promise<void> {
  if (imageQueue) {
    await imageQueue.close();
    imageQueue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
