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

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  FRONTEND_URL: getOptionalEnv('FRONTEND_URL') ?? 'http://localhost:5173',
  PORT: parseInt(getOptionalEnv('PORT') ?? '3000', 10),
  NODE_ENV: getOptionalEnv('NODE_ENV') ?? 'development',

  // Optional AI provider keys
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),
  OPENAI_API_KEY: getOptionalEnv('OPENAI_API_KEY'),
} as const;
