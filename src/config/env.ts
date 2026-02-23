import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  OPENAI_API_KEY: z.string().optional(), // Optional for LM Studio usage
  LLM_STUDIO_ENDPOINT: z.string().optional(), // LLM Studio Server endpoint (e.g., http://localhost:1234/v1)
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, 'FIREBASE_CLIENT_EMAIL is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  PORT: z.string().default('6174'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Comma-separated list of allowed CORS origins. Defaults to '*' in development. */
  CORS_ORIGINS: z.string().optional(),
});

function parseEnvFile(filePath: string): Record<string, string> {
  const envVars: Record<string, string> = {};

  if (!existsSync(filePath)) {
    return envVars;
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }
  }

  return envVars;
}

function loadEnv() {
  const rootDir = resolve(import.meta.dir, '../../');

  // Load .env first (base/defaults)
  const envFile = parseEnvFile(resolve(rootDir, '.env'));

  // Load .env.local second (higher priority, overrides .env)
  const envLocal = parseEnvFile(resolve(rootDir, '.env.local'));

  // Priority: .env.local > .env > process.env
  return {
    DATABASE_URL: envLocal.DATABASE_URL || envFile.DATABASE_URL || process.env.DATABASE_URL,
    OPENAI_API_KEY: envLocal.OPENAI_API_KEY || envFile.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    LLM_STUDIO_ENDPOINT: envLocal.LLM_STUDIO_ENDPOINT || envFile.LLM_STUDIO_ENDPOINT || process.env.LLM_STUDIO_ENDPOINT,
    FIREBASE_PROJECT_ID: envLocal.FIREBASE_PROJECT_ID || envFile.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: envLocal.FIREBASE_CLIENT_EMAIL || envFile.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: envLocal.FIREBASE_PRIVATE_KEY || envFile.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY,
    PORT: envLocal.PORT || envFile.PORT || process.env.PORT,
    NODE_ENV: envLocal.NODE_ENV || envFile.NODE_ENV || process.env.NODE_ENV,
    CORS_ORIGINS: envLocal.CORS_ORIGINS || envFile.CORS_ORIGINS || process.env.CORS_ORIGINS,
  };
}

function validateEnv() {
  const env = loadEnv();

  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = validateEnv();
