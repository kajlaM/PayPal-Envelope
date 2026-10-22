import { Client } from '@elastic/elasticsearch';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env no matter which app imports this package.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

export const AUDIT_INDEX = 'kubepay-decisions';

const url = () => process.env.ELASTIC_URL?.trim();
const apiKey = () => process.env.ELASTIC_API_KEY?.trim();

/** Audit is optional: without ELASTIC_URL / ELASTIC_API_KEY everything else still works. */
export const auditEnabled = () => !!url() && !!apiKey();

let client: Client | undefined;

export function es(): Client {
  if (!auditEnabled()) throw new Error('Set ELASTIC_URL and ELASTIC_API_KEY in .env');
  client ??= new Client({ node: url()!, auth: { apiKey: apiKey()! }, requestTimeout: 30_000 });
  return client;
}
