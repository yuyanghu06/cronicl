const requiredEnvVars = [
  'DATABASE_URL',
] as const;

type EnvVar = (typeof requiredEnvVars)[number];

function getEnv(key: EnvVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

if (!process.env.NODE_ENV) {
  console.warn('Warning: NODE_ENV is not set, defaulting to "development"');
}

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  FRONTEND_URL: getOptionalEnv('FRONTEND_URL') ?? 'http://localhost:5173',
  PORT: parseInt(getOptionalEnv('PORT') ?? '3000', 10),
  NODE_ENV: getOptionalEnv('NODE_ENV') ?? 'development',

  // Optional AI provider keys
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),
  OPENAI_API_KEY: getOptionalEnv('OPENAI_API_KEY'),

  // Optional Redis (BullMQ job queue)
  REDIS_URL: getOptionalEnv('REDIS_URL'),

  // Optional Railway OAuth
  RAILWAY_OAUTH_CLIENT_ID: getOptionalEnv('RAILWAY_OAUTH_CLIENT_ID'),
  RAILWAY_OAUTH_CLIENT_SECRET: getOptionalEnv('RAILWAY_OAUTH_CLIENT_SECRET'),
  RAILWAY_OAUTH_CALLBACK_URL: getOptionalEnv('RAILWAY_OAUTH_CALLBACK_URL'),

  // Optional Cloudflare R2 (image storage)
  R2_ACCOUNT_ID: getOptionalEnv('R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: getOptionalEnv('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: getOptionalEnv('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME: getOptionalEnv('R2_BUCKET_NAME'),
  R2_PUBLIC_URL: getOptionalEnv('R2_PUBLIC_URL'),
} as const;
