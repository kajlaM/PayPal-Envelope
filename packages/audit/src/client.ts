import { Client } from '@elastic/elasticsearch';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env no matter which app imports this package.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

// Embeddings come from our own Gemini key (EMBED_ENDPOINT) instead of Elastic's hosted models.
export const AUDIT_INDEX = 'paypalvault-audit';
// The index from before the rename (old project name). Copied into AUDIT_INDEX once, then left as is.
export const LEGACY_AUDIT_INDEX = 'kubepay-audit-v2';

// Elastic inference endpoint that turns audit summaries into embeddings with Gemini.
export const EMBED_ENDPOINT = 'paypalvault-gemini-embed';
export const EMBED_MODEL = 'gemini-embedding-001';
export const embedKey = () => process.env.ELASTIC_GEMINI_API_KEY?.trim() || undefined;

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
