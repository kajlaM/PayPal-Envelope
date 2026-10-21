import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// The .env file lives at the repo root.
config({ path: '../../.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Not using env() so `prisma generate` works before a database exists.
    url: process.env.DATABASE_URL ?? '',
  },
});
