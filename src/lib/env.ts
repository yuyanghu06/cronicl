const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
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

function getJwtSecret(key: EnvVar): string {
  const value = getEnv(key);
  if (value.length < 32) {
    throw new Error(`${key} must be at least 32 characters (got ${value.length})`);
  }
  return value;
}

if (!process.env.NODE_ENV) {
  console.warn('Warning: NODE_ENV is not set, defaulting to "development"');
}

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  JWT_ACCESS_SECRET: getJwtSecret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getJwtSecret('JWT_REFRESH_SECRET'),
  FRONTEND_URL: getOptionalEnv('FRONTEND_URL') ?? 'http://localhost:5173',
  PORT: parseInt(getOptionalEnv('PORT') ?? '3000', 10),
  NODE_ENV: getOptionalEnv('NODE_ENV') ?? 'development',

  // Optional AI provider keys
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),
  OPENAI_API_KEY: getOptionalEnv('OPENAI_API_KEY'),

  // Optional Railway OAuth
  RAILWAY_OAUTH_CLIENT_ID: getOptionalEnv('RAILWAY_OAUTH_CLIENT_ID'),
  RAILWAY_OAUTH_CLIENT_SECRET: getOptionalEnv('RAILWAY_OAUTH_CLIENT_SECRET'),
  RAILWAY_OAUTH_CALLBACK_URL: getOptionalEnv('RAILWAY_OAUTH_CALLBACK_URL'),
} as const;
