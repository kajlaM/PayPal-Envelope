import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

// Load the repo-root .env no matter which app imports this package.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

// Neon closes connections when it sleeps (after 5 idle minutes), so drop idle ones after 1 minute.
// New connections can be slow on a weak network, so wait up to 30s for one.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 30_000,
  keepAlive: true,
});

export const prisma = new PrismaClient({
  adapter,
  transactionOptions: { maxWait: 30_000, timeout: 30_000 },
});
