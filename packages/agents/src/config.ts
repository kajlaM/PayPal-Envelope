import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env no matter which app imports this package.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const key = (name: string) => process.env[name]?.trim() || undefined;

/** Where the KubePay API runs. Agents spend only through it. */
export const apiUrl = () => (key('KUBEPAY_API_URL') ?? `http://localhost:${key('PORT') ?? 4000}`).replace(/\/$/, '');

export const internalKey = () => {
  const value = key('INTERNAL_API_KEY');
  if (!value) throw new Error('Missing INTERNAL_API_KEY in .env');
  return value;
};

/** Optional sponsor keys. Without them the agents fall back to the demo store and a plain fetch. */
export const channel3Key = () => key('CHANNEL3_API_KEY');
export const kernelKey = () => key('KERNEL_API_KEY');
