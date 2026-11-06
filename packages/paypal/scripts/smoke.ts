// Checks every PayPal API we use against the sandbox. Run: npm run smoke -w @paypalvault/paypal
// Fill PAYPAL_*, UTILITY_* and the sandbox emails in .env first.
import { randomUUID } from 'node:crypto';
import {
  getAccessToken, createOrder, sendPayout, getPayout, createInvoice, sendInvoice, listInvoices, PayPalApiError,
} from '../src/index.ts';
import { platformCredentials, utilityCredentials } from '../src/config.ts';

async function step(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    console.log(`PASS  ${name}`, result ?? '');
  } catch (e) {
    const detail = e instanceof PayPalApiError ? `${e.message} (debug id ${e.debugId})` : (e as Error).message;
    console.log(`FAIL  ${name}: ${detail}`);
    process.exitCode = 1;
  }
}

await step('platform app token', async () => (await getAccessToken(platformCredentials())).slice(0, 12) + '...');
await step('utility app token', async () => (await getAccessToken(utilityCredentials())).slice(0, 12) + '...');

await step('Orders: create $1.00 order', () =>
  createOrder({ vaultId: 'smoke-test', amountCents: 100, description: 'PayPalVault smoke test' }));

let batchId = '';
await step('Payouts: send $1.00 to audio-store', async () => {
  const res = await sendPayout({
    ledgerEntryId: `smoke-${randomUUID()}`,
    receiverEmail: process.env.AUDIO_STORE_SANDBOX_EMAIL!,
    amountCents: 100,
    note: 'PayPalVault smoke test',
  });
  batchId = res.payoutBatchId;
  return res;
});
if (batchId) await step('Payouts: read batch', () => getPayout(batchId));

await step('Invoicing: create + send $2.00 bill to platform', async () => {
  const platformEmail = process.env.PLATFORM_SANDBOX_EMAIL;
  if (!platformEmail) throw new Error('Set PLATFORM_SANDBOX_EMAIL in .env');
  const invoice = await createInvoice({ recipientEmail: platformEmail, amountCents: 200, itemName: 'Smoke test bill' });
  await sendInvoice(invoice.id);
  return invoice.id;
});
await step('Invoicing: list', async () => `${(await listInvoices()).length} invoices`);
