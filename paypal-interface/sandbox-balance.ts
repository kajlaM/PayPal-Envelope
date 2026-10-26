// Live PayPal balance of a sandbox personal account.
// PayPal has no API for a personal account's balance (and sandbox personal accounts get no Classic
// API credentials), so this logs in to sandbox.paypal.com as the account in a hidden Chrome and reads
// the balance PayPal itself shows. The login password comes from .env (Account.sandboxPasswordEnv).
// Each account keeps its own browser profile in data/browser/, so PayPal's login cookies survive
// and most reads skip the login. Results are cached briefly; force a read after money moves.
// The same hidden browser also links the account to the site (paypal-link.ts, autoLink).

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright-core';
import type { Account } from './accounts.ts';

const SANDBOX = 'https://www.sandbox.paypal.com';
const CHROME = process.env.CHROME_PATH?.trim() || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILES = fileURLToPath(new URL('./data/browser/', import.meta.url));
const CACHE_MS = 30_000;

export type SandboxBalance =
  | { status: 'OK'; cents: number; readAt: string }
  | { status: 'NO_PASSWORD'; env: string }
  | { status: 'ERROR'; message: string };

const cache = new Map<string, { result: SandboxBalance; at: number }>();
const reading = new Map<string, Promise<SandboxBalance>>();
const browsers = new Map<string, Promise<unknown>>(); // one Chrome per account profile at a time

export class NoSandboxPasswordError extends Error {
  constructor(public env: string) {
    super(`Add ${env} (the PayPal sandbox login password) to .env`);
  }
}

/**
 * Runs `fn` in the account's hidden Chrome. Calls for the same account wait their turn, because a
 * browser profile can only be open once.
 */
export function withSandboxPage<T>(account: Account, fn: (page: Page, password: string) => Promise<T>): Promise<T> {
  const password = process.env[account.sandboxPasswordEnv]?.trim();
  if (!password) return Promise.reject(new NoSandboxPasswordError(account.sandboxPasswordEnv));

  const run = (browsers.get(account.username) ?? Promise.resolve()).then(async () => {
    const dir = `${PROFILES}${account.username}`;
    await mkdir(dir, { recursive: true });
    const context = await chromium.launchPersistentContext(dir, { executablePath: CHROME, headless: true, viewport: { width: 1280, height: 900 } });
    try {
      const page = context.pages()[0] ?? (await context.newPage());
      page.setDefaultTimeout(30_000);
      page.setDefaultNavigationTimeout(90_000); // the sandbox is sometimes slow
      return await fn(page, password);
    } finally {
      await context.close();
    }
  });
  browsers.set(account.username, run.catch(() => undefined));
  return run;
}

/** The account's current sandbox balance. Cached for 30 s unless `force` is set. */
export async function sandboxBalance(account: Account, opts: { force?: boolean } = {}): Promise<SandboxBalance> {
  const password = process.env[account.sandboxPasswordEnv]?.trim();
  if (!password) return { status: 'NO_PASSWORD', env: account.sandboxPasswordEnv };

  const hit = cache.get(account.username);
  if (!opts.force && hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  // One browser per account at a time; parallel callers share the same read.
  let pending = reading.get(account.username);
  if (!pending) {
    pending = readBalance(account)
      .then((cents): SandboxBalance => ({ status: 'OK', cents, readAt: new Date().toISOString() }))
      .catch((err): SandboxBalance => ({ status: 'ERROR', message: (err as Error).message.split('\n')[0] }))
      .then((result) => {
        // Keep showing the last good balance if one read fails.
        if (result.status === 'OK' || !hit || hit.result.status !== 'OK') cache.set(account.username, { result, at: Date.now() });
        return result.status === 'OK' || !hit ? result : hit.result;
      })
      .finally(() => reading.delete(account.username));
    reading.set(account.username, pending);
  }
  return pending;
}

/** Forget the cached balance (call after a vault payment or refund). */
export function balanceChanged(account: Account) {
  cache.delete(account.username);
}

function readBalance(account: Account): Promise<number> {
  return withSandboxPage(account, async (page, password) => {
    await page.goto(`${SANDBOX}/myaccount/summary`, { waitUntil: 'domcontentloaded' });

    if (/\/signin/.test(page.url()) || (await page.locator('#email, #password').count()) > 0) {
      await login(page, account.sandboxEmail, password);
      if (!/\/myaccount/.test(page.url())) await page.goto(`${SANDBOX}/myaccount/summary`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForLoadState('networkidle').catch(() => undefined);
    return parseBalance(await page.locator('body').innerText());
  });
}

/** Clicks the button, or presses Enter in the field when the button can't be clicked. */
async function submit(page: Page, button: string, field: string) {
  await page.locator(button).click({ timeout: 5_000 }).catch(() => page.locator(field).press('Enter'));
}

// PayPal shows two login layouts: email then "Next" then password, or both fields on one screen.
// `done` waits for the page PayPal shows after logging in (the account summary by default).
export async function login(page: Page, email: string, password: string, done = () => page.waitForURL(/\/myaccount\//, { timeout: 45_000 })) {
  const emailBox = page.locator('#email');
  const passwordBox = page.locator('#password');
  if (await emailBox.isVisible().catch(() => false)) {
    await emailBox.fill(email);
    if (!(await passwordBox.isVisible().catch(() => false))) await submit(page, '#btnNext', '#email');
  }
  await passwordBox.waitFor({ state: 'visible' });
  await passwordBox.fill(password);
  await submit(page, '#btnLogin', '#password');
  await done().catch(async () => {
    const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Could not log in to the PayPal sandbox as ${email} (check the password in .env). Page said: ${text}`);
  });
}

/** Finds the amount PayPal shows as the PayPal balance, e.g. "$4,950.00 USD" -> 495000. */
export function parseBalance(text: string): number {
  const amount = /(-?)\$\s?([\d,]+\.\d{2})/;
  const start = text.search(/PayPal balance/i);
  const match = amount.exec(start >= 0 ? text.slice(start, start + 400) : text);
  if (!match) throw new Error('Could not find the balance on the PayPal sandbox page');
  const cents = Math.round(Number(match[2]!.replace(/,/g, '')) * 100);
  return match[1] ? -cents : cents;
}
