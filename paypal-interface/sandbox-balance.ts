// Live PayPal balance of a sandbox personal account.
// PayPal has no API for a personal account's balance (and sandbox personal accounts get no Classic
// API credentials), so this logs in to sandbox.paypal.com as the account in a hidden Chrome and reads
// the balance PayPal itself shows. The login password comes from .env (Account.sandboxPasswordEnv).
// Each account keeps its own browser profile in data/browser/, so PayPal's login cookies survive
// and most reads skip the login. Results are cached briefly; force a read after money moves.
// The same hidden browser also links the account to the site (paypal-link.ts, autoLink).

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Kernel from '@onkernel/sdk';
import { chromium, type BrowserContext, type Page } from 'playwright-core';
import type { Account } from './accounts.ts';

const SANDBOX = 'https://www.sandbox.paypal.com';
const CHROME = process.env.CHROME_PATH?.trim() || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1280, height: 900 };
const PROFILES = fileURLToPath(new URL('./data/browser/', import.meta.url));
const CACHE_MS = 30_000;

// `unclaimed`: the account has no PayPal balance yet, so PayPal holds money sent to it (vault refunds)
// as "Money is waiting for you" until the owner accepts it on PayPal. `cents` is that held amount, and
// payments from the account are charged to its bank or card instead.
export type SandboxBalance =
  | { status: 'OK'; cents: number; unclaimed: boolean; readAt: string }
  | { status: 'NO_PASSWORD'; env: string }
  | { status: 'ERROR'; message: string };

const cache = new Map<string, { result: SandboxBalance; at: number; version: number }>();
const reading = new Map<string, { version: number; promise: Promise<SandboxBalance> }>();
// Bumped by balanceChanged(). A read that started before money moved is neither reused nor cached.
const versions = new Map<string, number>();
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
    const kernelKey = process.env.KERNEL_API_KEY?.trim();
    return kernelKey ? inKernelBrowser(kernelKey, account, (page) => fn(page, password)) : inLocalChrome(account, (page) => fn(page, password));
  });
  browsers.set(account.username, run.catch(() => undefined));
  return run;
}

async function onPage<T>(context: BrowserContext, fn: (page: Page) => Promise<T>): Promise<T> {
  const page = context.pages()[0] ?? (await context.newPage());
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(90_000); // the sandbox is sometimes slow
  return fn(page);
}

/** Local runs: the installed Chrome, with the account's profile folder in data/browser/. */
async function inLocalChrome<T>(account: Account, fn: (page: Page) => Promise<T>): Promise<T> {
  const dir = `${PROFILES}${account.username}`;
  await mkdir(dir, { recursive: true });
  const context = await chromium.launchPersistentContext(dir, { executablePath: CHROME, headless: true, viewport: VIEWPORT });
  try {
    return await onPage(context, fn);
  } finally {
    await context.close();
  }
}

/**
 * Hosted runs (no Chrome on the server): a Kernel cloud browser. Each account keeps a Kernel profile
 * that is saved when the session ends, so PayPal's login cookies survive between reads, as they do
 * in the local profile folders.
 */
async function inKernelBrowser<T>(apiKey: string, account: Account, fn: (page: Page) => Promise<T>): Promise<T> {
  const kernel = new Kernel({ apiKey });
  const profile = `paypal-sandbox-${account.username}`.replace(/[^A-Za-z0-9._-]/g, '-');
  await kernel.profiles.retrieve(profile).catch((err: { status?: number }) => {
    if (err?.status !== 404) throw err;
    return kernel.profiles.create({ name: profile });
  });
  const session = await kernel.browsers.create({ headless: true, profile: { name: profile, save_changes: true } });
  try {
    const browser = await chromium.connectOverCDP(session.cdp_ws_url);
    try {
      const context = browser.contexts()[0] ?? (await browser.newContext());
      return await onPage(context, async (page) => {
        await page.setViewportSize(VIEWPORT);
        return fn(page);
      });
    } finally {
      await browser.close().catch(() => undefined);
    }
  } finally {
    await kernel.browsers.deleteByID(session.session_id).catch(() => undefined); // ends the session, saving the profile
  }
}

/** The account's current sandbox balance. Cached for 30 s unless `force` is set. */
export async function sandboxBalance(account: Account, opts: { force?: boolean } = {}): Promise<SandboxBalance> {
  const password = process.env[account.sandboxPasswordEnv]?.trim();
  if (!password) return { status: 'NO_PASSWORD', env: account.sandboxPasswordEnv };

  const version = versions.get(account.username) ?? 0;
  const hit = cache.get(account.username);
  if (!opts.force && hit?.version === version && Date.now() - hit.at < CACHE_MS) return hit.result;

  // One browser per account at a time; parallel callers share a read, unless money moved after it began.
  const running = reading.get(account.username);
  if (running?.version === version) return running.promise;

  const promise: Promise<SandboxBalance> = readBalance(account)
    .then((read): SandboxBalance => ({ status: 'OK', ...read, readAt: new Date().toISOString() }))
    .catch((err): SandboxBalance => ({ status: 'ERROR', message: (err as Error).message.split('\n')[0] }))
    .then((result) => {
      // Keep showing the last good balance if one read fails.
      const last = cache.get(account.username);
      if (result.status === 'OK' || !last || last.result.status !== 'OK') cache.set(account.username, { result, at: Date.now(), version });
      return result.status === 'OK' || !last ? result : last.result;
    })
    .finally(() => {
      if (reading.get(account.username)?.promise === promise) reading.delete(account.username);
    });
  reading.set(account.username, { version, promise });
  return promise;
}

/** Money moved (vault payment or refund): the next read goes to PayPal again. */
export function balanceChanged(account: Account) {
  versions.set(account.username, (versions.get(account.username) ?? 0) + 1);
}

function readBalance(account: Account): Promise<{ cents: number; unclaimed: boolean }> {
  return withSandboxPage(account, async (page, password) => {
    await page.goto(`${SANDBOX}/myaccount/summary`, { waitUntil: 'domcontentloaded' });

    if (/\/signin/.test(page.url()) || (await page.locator('#email, #password').count()) > 0) {
      await login(page, account.sandboxEmail, password);
      if (!/\/myaccount/.test(page.url())) await page.goto(`${SANDBOX}/myaccount/summary`, { waitUntil: 'domcontentloaded' });
    }
    return waitForBalanceCard(page);
  });
}

// The summary page keeps polling PayPal, so it never goes network-idle (waiting for that took 90 s per
// read). Instead wait for PayPal's balance card, which is drawn about a second after the page loads.
async function waitForBalanceCard(page: Page): Promise<{ cents: number; unclaimed: boolean }> {
  const card = page.locator('[data-test-id="available-balance"]').first();
  const found = await card.waitFor({ state: 'visible', timeout: 30_000 }).then(() => true, () => false);
  if (!found) return { cents: parseBalance(await page.locator('body').innerText()), unclaimed: false }; // layout changed
  const cardText = await card.locator('xpath=ancestor::*[@data-id="card"][1]').innerText().catch(() => card.innerText());
  return { cents: parseBalance(cardText), unclaimed: /money is waiting/i.test(cardText) };
}

/** Clicks the button, or presses Enter in the field when the button can't be clicked. */
/** Clicks the first visible one of `buttons` (PayPal's page holds hidden copies), else presses Enter. */
async function submit(page: Page, buttons: string[], field: string) {
  const button = page.locator(buttons.map((b) => `${b}:visible`).join(', ')).first();
  if (await button.count() && (await button.click({ timeout: 5_000 }).then(() => true, () => false))) return;
  // No button, or the click timed out (often because PayPal is already moving to the next page):
  // press Enter only if the field is still on screen.
  const box = page.locator(`${field}:visible`).first();
  if (await box.count().catch(() => 0)) await box.press('Enter', { timeout: 5_000 }).catch(() => undefined);
}

// PayPal's login comes in several layouts: email, then "Next" or "Continue", then the password
// (sometimes behind "Use password instead"), or both fields on one screen. The page also holds
// hidden copies of fields and buttons, so only visible ones are used.
// `done` waits for the page PayPal shows after logging in (the account summary by default).
export async function login(page: Page, email: string, password: string, done = () => page.waitForURL(/\/myaccount\//, { timeout: 45_000 })) {
  const emailBox = page.locator('#email:visible').first();
  if (await emailBox.count()) {
    await emailBox.fill(email);
    // The email step has its own button when the password comes on the next screen.
    if (await page.locator('#btnNext:visible, #continueBtn:visible').count()) {
      await submit(page, ['#btnNext', '#continueBtn'], '#email');
      await page.locator('#password:visible, #secondaryLoginBtn:visible').first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
    }
  }
  const usePassword = page.locator('#secondaryLoginBtn:visible').first(); // offered instead of a passkey / the app
  if (await usePassword.count()) await usePassword.click({ timeout: 5_000 }).catch(() => undefined);
  const passwordBox = page.locator('#password:visible').first();
  await passwordBox.waitFor({ state: 'visible' });
  await passwordBox.fill(password);
  await submit(page, ['#btnLogin'], '#password');
  await done().catch(async () => {
    const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Could not log in to the PayPal sandbox as ${email} (check the password in .env). Page said: ${text}`);
  });
}

/** Finds the amount PayPal shows as the PayPal balance, e.g. "$4,950.00 USD" -> 495000. */
/**
 * The balance next to its label, or null while the page has not drawn it yet. Business dashboards
 * put the amount before the label ("$5,212.70 USD Available balance"); the personal summary after
 * it ("PayPal balance $4,950.00").
 */
export function parseLabeledBalance(text: string): number | null {
  const toCents = (sign: string | undefined, value: string) => (sign ? -1 : 1) * Math.round(Number(value.replace(/,/g, '')) * 100);
  const before = /(-?)\$\s?([\d,]+\.\d{2})\s*(?:USD)?\s*Available balance/i.exec(text);
  if (before) return toCents(before[1], before[2]!);
  const start = text.search(/PayPal balance/i);
  const after = start >= 0 ? /(-?)\$\s?([\d,]+\.\d{2})/.exec(text.slice(start, start + 400)) : null;
  return after ? toCents(after[1], after[2]!) : null;
}

export function parseBalance(text: string): number {
  const amount = /(-?)\$\s?([\d,]+\.\d{2})/;
  const start = text.search(/PayPal balance/i);
  const match = amount.exec(start >= 0 ? text.slice(start, start + 400) : text);
  if (!match) throw new Error('Could not find the balance on the PayPal sandbox page');
  const cents = Math.round(Number(match[2]!.replace(/,/g, '')) * 100);
  return match[1] ? -cents : cents;
}
