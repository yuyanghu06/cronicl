const requiredEnvVars = ['DATABASE_URL'] as const;

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
  FRONTEND_URL: getOptionalEnv('FRONTEND_URL') ?? 'http://localhost:5173',
  PORT: parseInt(getOptionalEnv('PORT') ?? '3000', 10),
  NODE_ENV: getOptionalEnv('NODE_ENV') ?? 'development',

  // Optional AI provider keys
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),
  OPENAI_API_KEY: getOptionalEnv('OPENAI_API_KEY'),
} as const;
