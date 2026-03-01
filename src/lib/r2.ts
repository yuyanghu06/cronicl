import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';
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
