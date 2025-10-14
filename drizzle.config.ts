import type { Config } from 'drizzle-kit';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env and .env.local
function loadDatabaseUrl(): string {
  const rootDir = resolve(__dirname);

  function parseEnvFile(filePath: string): Record<string, string> {
    const envVars: Record<string, string> = {};

    if (!existsSync(filePath)) {
      return envVars;
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    }

    return envVars;
  }

  const envFile = parseEnvFile(resolve(rootDir, '.env'));
  const envLocal = parseEnvFile(resolve(rootDir, '.env.local'));

  // Priority: .env.local > .env > process.env
  return envLocal.DATABASE_URL || envFile.DATABASE_URL || process.env.DATABASE_URL || '';
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: loadDatabaseUrl(),
  },
} satisfies Config;
