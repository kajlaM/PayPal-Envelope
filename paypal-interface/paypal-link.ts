// Linking a customer's PayPal sandbox account to the site, and charging it later without a popup.
// Uses PayPal's Vault API (v3 payment tokens): the customer approves once on sandbox.paypal.com,
// then the platform may create orders against the saved account ("vault_id"). Reuses the
// PayPalVault PayPal client, so tokens, request ids and errors behave like the rest of the backend.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prisma } from '@paypalvault/db';
import { createPaymentToken, createPayPalSetupToken, deletePaymentToken } from '@paypalvault/paypal';
import { ACCOUNTS, type Account } from './accounts.ts';
import { login, withSandboxPage } from './sandbox-balance.ts';

export type PayPalLink = { paymentTokenId: string; customerId: string; email: string; linkedAt: string };

// ---------- Saved links (one per customer), kept in the PayPalVault database ----------
// The database (paypal_links, keyed by the PayPal email) lets the API charge savings payments too.
// Links made before that lived in data/links.json; they are copied over the first time they are read.

const LEGACY_FILE = fileURLToPath(new URL('./data/links.json', import.meta.url));

async function legacyLink(username: string): Promise<PayPalLink | null> {
  try {
    return (JSON.parse(await readFile(LEGACY_FILE, 'utf8')) as Record<string, PayPalLink>)[username] ?? null;
  } catch {
    return null;
  }
}

async function forgetLegacyLink(username: string) {
  try {
    const links = JSON.parse(await readFile(LEGACY_FILE, 'utf8')) as Record<string, PayPalLink>;
    if (!(username in links)) return;
    delete links[username];
    await writeFile(LEGACY_FILE, JSON.stringify(links, null, 2));
  } catch {
    // no old file: nothing to forget
  }
}

const emailOf = (username: string) => {
  const account = ACCOUNTS[username];
  if (!account) throw new Error(`Unknown customer ${username}`);
  return account.sandboxEmail.toLowerCase();
};

export async function getLink(username: string): Promise<PayPalLink | null> {
  const email = emailOf(username);
  const row = await prisma.paypalLink.findUnique({ where: { email } });
  if (row) return { paymentTokenId: row.paymentTokenId, customerId: row.customerId, email: row.email, linkedAt: row.linkedAt.toISOString() };
  const legacy = await legacyLink(username);
  if (legacy && legacy.email.toLowerCase() === email) await saveLink(username, legacy);
  return legacy && legacy.email.toLowerCase() === email ? legacy : null;
}

async function saveLink(username: string, link: PayPalLink | null) {
  const email = emailOf(username);
  if (!link) {
    await prisma.paypalLink.deleteMany({ where: { email } });
    await forgetLegacyLink(username); // or the old file would bring it back
    return;
  }
  const data = { username, paymentTokenId: link.paymentTokenId, customerId: link.customerId, linkedAt: new Date(link.linkedAt) };
  await prisma.paypalLink.upsert({ where: { email }, create: { email, ...data }, update: data });
}

export const unlink = (username: string) => saveLink(username, null);

// ---------- Step 1: setup token -> customer approves on sandbox.paypal.com ----------

/** Vault API setup token (PayPal Server SDK). Returns the PayPal page where the customer approves the link. */
export function startLink(urls: { returnUrl: string; cancelUrl: string }) {
  return createPayPalSetupToken({
    description: 'PayPalVault vaults: fund vaults from your PayPal account',
    permitMultiplePaymentTokens: true,
    ...urls,
  });
}

// ---------- Step 2: approved setup token -> saved payment token ----------

/**
 * Vault API payment token (PayPal Server SDK). Only keeps the link when the approved PayPal account is the
 * customer's own sandbox account, so Jugal can never fund vaults from Kajla's PayPal.
 */
export async function finishLink(username: string, setupTokenId: string, expectedEmail: string): Promise<PayPalLink> {
  const token = await createPaymentToken(setupTokenId, `link-${setupTokenId}`);
  const email = token.email;
  if (email.toLowerCase() !== expectedEmail.toLowerCase()) {
    await deletePaymentToken(token.paymentTokenId).catch(() => undefined);
    throw new LinkError(`You approved with ${email || 'another PayPal account'}. Log in to PayPal as ${expectedEmail}.`);
  }
  const link = { paymentTokenId: token.paymentTokenId, customerId: token.customerId, email, linkedAt: new Date().toISOString() };
  await saveLink(username, link);
  return link;
}

export class LinkError extends Error {}

// ---------- Automatic link (no popup) ----------

/**
 * Links the customer's sandbox account without asking them to log in to PayPal again: the account's
 * hidden Chrome (sandbox-balance.ts), logged in with the sandbox password from .env, approves the
 * setup token. Sandbox demo only: a real site never holds its customers' PayPal passwords.
 * `siteUrl` is this site's address; PayPal redirects back to it, and that redirect is caught in the
 * hidden browser instead of being loaded.
 */
export async function autoLink(account: Account, siteUrl: string): Promise<PayPalLink> {
  const back = `${siteUrl}/paypal/link/`;
  const { setupTokenId, approveUrl } = await startLink({ returnUrl: `${back}return`, cancelUrl: `${back}cancel` });

  const returned = await withSandboxPage(account, async (page, password) => {
    await page.route(`${back}**`, (route) => route.fulfill({ body: 'ok' }));
    const redirect = page.waitForRequest((r) => r.url().startsWith(back), { timeout: 120_000 });
    redirect.catch(() => undefined); // awaited below; avoid an unhandled rejection if an earlier step fails

    await page.goto(approveUrl, { waitUntil: 'domcontentloaded' });
    const consent = page.locator('#consentButton'); // "Save and Continue"
    await page.locator('#email, #password, #consentButton').first().waitFor({ timeout: 60_000 });
    if (!(await consent.isVisible())) {
      await login(page, account.sandboxEmail, password, () => consent.waitFor({ timeout: 45_000 }));
    }
    await consent.click();
    return new URL((await redirect).url());
  });

  if (returned.pathname.endsWith('/cancel')) throw new LinkError('PayPal cancelled the link.');
  if (returned.searchParams.get('approval_token_id') !== setupTokenId) throw new LinkError('PayPal did not approve the link.');
  return finishLink(account.username, setupTokenId, account.sandboxEmail);
}

// ---------- Charging the saved account ----------
// Lives in the PayPalVault PayPal package, so the API can take savings payments with the same code.
export { chargeSavedPayPal } from '@paypalvault/paypal';
