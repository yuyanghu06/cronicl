import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { isNotNull } from 'drizzle-orm';
import { env } from './env';
import { db } from '../db/client';
import { timelineNodes, characterBible } from '../db/schema';
import { randomUUID } from 'crypto';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

let client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (client) return client;
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    return null;
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export async function uploadImage(
  base64: string,
  mimeType: string,
  prefix: string
): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2 || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) return null;

  const ext = MIME_TO_EXT[mimeType] ?? 'png';
  const key = `${prefix}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64, 'base64');

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function listObjects(
  prefix: string
): Promise<{ key: string; lastModified: Date }[]> {
  const r2 = getR2Client();
  if (!r2 || !env.R2_BUCKET_NAME) return [];

  const results: { key: string; lastModified: Date }[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.LastModified) {
        results.push({ key: obj.Key, lastModified: obj.LastModified });
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return results;
}

export async function deleteObjects(keys: string[]): Promise<number> {
  const r2 = getR2Client();
  if (!r2 || !env.R2_BUCKET_NAME || keys.length === 0) return 0;

  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    deleted += batch.length;
  }
  return deleted;
}

export async function cleanupOrphanedImages(): Promise<{ scanned: number; deleted: number }> {
  const r2 = getR2Client();
  if (!r2 || !env.R2_BUCKET_NAME || !env.R2_PUBLIC_URL) {
    return { scanned: 0, deleted: 0 };
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1-hour grace period

  // Fetch all referenced R2 keys from the DB
  const [nodeRows, charRows] = await Promise.all([
    db
      .select({ imageUrl: timelineNodes.imageUrl })
      .from(timelineNodes)
      .where(isNotNull(timelineNodes.imageUrl)),
    db
      .select({ referenceImageUrl: characterBible.referenceImageUrl })
      .from(characterBible)
      .where(isNotNull(characterBible.referenceImageUrl)),
  ]);

  const publicPrefix = `${env.R2_PUBLIC_URL}/`;
  const referencedKeys = new Set<string>();

  for (const row of nodeRows) {
    if (row.imageUrl?.startsWith(publicPrefix)) {
      referencedKeys.add(row.imageUrl.slice(publicPrefix.length));
    }
  }
  for (const row of charRows) {
    if (row.referenceImageUrl?.startsWith(publicPrefix)) {
      referencedKeys.add(row.referenceImageUrl.slice(publicPrefix.length));
    }
  }

  // List R2 objects across all prefixes
  const [nodesObjs, portraitsObjs, generatedObjs] = await Promise.all([
    listObjects('nodes/'),
    listObjects('portraits/'),
    listObjects('generated/'),
  ]);
  const allObjects = [...nodesObjs, ...portraitsObjs, ...generatedObjs];

  // Identify orphans
  const orphanKeys: string[] = [];
  for (const obj of allObjects) {
    if (obj.lastModified >= cutoff) continue; // skip recent uploads

    if (obj.key.startsWith('generated/')) {
      orphanKeys.push(obj.key); // generated/ images are never tracked in DB
    } else if (!referencedKeys.has(obj.key)) {
      orphanKeys.push(obj.key);
    }
  }

  const deleted = await deleteObjects(orphanKeys);
  return { scanned: allObjects.length, deleted };
}
