// npm run setup:webhooks -w packages/paypal -- https://<public-api-url>
// Registers (or updates) the KubePay webhooks on both sandbox apps and prints the ids for .env.
import { upsertWebhook } from '../src/index.ts';

const base = process.argv[2]?.replace(/\/$/, '');
if (!base?.startsWith('https://')) {
  console.error('Usage: npm run setup:webhooks -w packages/paypal -- https://<public-api-url>');
  process.exit(1);
}

const platform = await upsertWebhook('platform', `${base}/webhooks/paypal`);
const utility = await upsertWebhook('utility', `${base}/webhooks/paypal/utility`);
console.log(`Platform webhook: ${platform.url} (${platform.events.length} events)`);
console.log(`Utility webhook:  ${utility.url} (${utility.events.length} events)`);
console.log(`\nPut these in .env:\nPAYPAL_WEBHOOK_ID=${platform.id}\nUTILITY_WEBHOOK_ID=${utility.id}`);
