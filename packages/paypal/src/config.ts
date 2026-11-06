import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env no matter which app imports this package.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

export type Credentials = { clientId: string; clientSecret: string };

export const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL ?? 'https://api-m.sandbox.paypal.com';

function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

/** App linked to the PayPalVault platform business account (holds vault money). */
export const platformCredentials = (): Credentials => ({
  clientId: need('PAYPAL_CLIENT_ID'),
  clientSecret: need('PAYPAL_CLIENT_SECRET'),
});

/** App linked to the city-utility business account (sends invoices). */
export const utilityCredentials = (): Credentials => ({
  clientId: need('UTILITY_CLIENT_ID'),
  clientSecret: need('UTILITY_CLIENT_SECRET'),
});

export const webhookId = () => need('PAYPAL_WEBHOOK_ID');
export const utilityWebhookId = () => need('UTILITY_WEBHOOK_ID');
