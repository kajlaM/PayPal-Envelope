// Live PayPal balance of a sandbox BUSINESS account (Audio Store, City Utility).
// 0. Best: PayPal's REST Balances API with the business's own REST app (<PREFIX>_CLIENT_ID / _SECRET).
// 1. Else: PayPal's GetBalance API (NVP/SOAP API credentials of that business account, from
//    developer.paypal.com > Sandbox accounts > the account). Fast and official, no browser.
//      <PREFIX>_API_USERNAME, <PREFIX>_API_PASSWORD, <PREFIX>_API_SIGNATURE   (e.g. AUDIO_STORE_API_...)
// 2. Fallback: the same approach as the personal balance (sandbox-balance.ts, unchanged): a hidden
//    Chrome logs in to sandbox.paypal.com with the account's login password (<PREFIX>_SANDBOX_PASSWORD).

import type { Page } from 'playwright-core';
import type { Account, BusinessAccount } from './accounts.ts';
import { login, parseBalance, parseLabeledBalance, withSandboxPage, type SandboxBalance } from './sandbox-balance.ts';
import { restCredentials, restGet } from './business-transactions.ts';

const SANDBOX = 'https://www.sandbox.paypal.com';
const NVP = process.env.PAYPAL_NVP_URL?.trim() || 'https://api-3t.sandbox.paypal.com/nvp';
const CACHE_MS = 30_000;
// Business accounts land on different home pages than personal ones; the first that shows a balance wins.
const PAGES = ['/myaccount/summary', '/mep/dashboard', '/businesshub/'];

const cache = new Map<string, { result: SandboxBalance; at: number }>();
const reading = new Map<string, Promise<SandboxBalance>>();

const env = (name: string) => process.env[name]?.trim() || undefined;

function apiCredentials(biz: BusinessAccount) {
  const user = env(`${biz.apiEnvPrefix}_API_USERNAME`);
  const pwd = env(`${biz.apiEnvPrefix}_API_PASSWORD`);
  const signature = env(`${biz.apiEnvPrefix}_API_SIGNATURE`);
  return user && pwd && signature ? { user, pwd, signature } : null;
}

export async function businessBalance(biz: BusinessAccount, opts: { force?: boolean } = {}): Promise<SandboxBalance> {
  const api = apiCredentials(biz);
  const rest = restCredentials(biz);
  if (!rest && !api && !env(biz.sandboxPasswordEnv)) return { status: 'NO_PASSWORD', env: `${biz.apiEnvPrefix}_API_USERNAME / _API_PASSWORD / _API_SIGNATURE` };

  const hit = cache.get(biz.username);
  if (!opts.force && hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  let pending = reading.get(biz.username);
  if (!pending) {
    // REST first; if the app may not read balances, fall back to the next way.
    const older = () => (api ? apiBalance(api) : env(biz.sandboxPasswordEnv) ? browserBalance(biz) : Promise.reject(new Error('No other way to read the balance')));
    const read = rest ? restBalance(biz).catch((err) => older().catch(() => Promise.reject(err))) : older();
    pending = read
      .then((cents): SandboxBalance => ({ status: 'OK', cents, unclaimed: false, readAt: new Date().toISOString() }))
      .catch((err): SandboxBalance => ({ status: 'ERROR', message: (err as Error).message.split('\n')[0]! }))
      .then((result) => {
        // Keep showing the last good balance if one read fails.
        if (result.status === 'OK' || !hit || hit.result.status !== 'OK') cache.set(biz.username, { result, at: Date.now() });
        return result.status === 'OK' || !hit ? result : hit.result;
      })
      .finally(() => reading.delete(biz.username));
    reading.set(biz.username, pending);
  }
  return pending;
}

/** PayPal REST Balances API: the USD balance PayPal shows as available, in cents. */
async function restBalance(biz: BusinessAccount): Promise<number> {
  const body = await restGet(biz, '/v1/reporting/balances?currency_code=USD');
  const usd = (body.balances ?? []).find((b: any) => b.currency === 'USD') ?? body.balances?.[0];
  const value = usd?.available_balance?.value ?? usd?.total_balance?.value;
  if (value == null) throw new Error('PayPal Balances API returned no USD balance');
  return Math.round(Number(value) * 100);
}

/** PayPal GetBalance (NVP): the USD balance of the account the API credentials belong to, in cents. */
async function apiBalance(api: { user: string; pwd: string; signature: string }): Promise<number> {
  const body = new URLSearchParams({
    USER: api.user, PWD: api.pwd, SIGNATURE: api.signature,
    METHOD: 'GetBalance', VERSION: '204', RETURNALLCURRENCIES: '1',
  });
  const res = await fetch(NVP, { method: 'POST', body, signal: AbortSignal.timeout(20_000) });
  const out = Object.fromEntries(new URLSearchParams(await res.text()));
  if (!res.ok || !/^Success/.test(out.ACK ?? '')) {
    throw new Error(`PayPal GetBalance failed: ${out.L_LONGMESSAGE0 ?? out.L_SHORTMESSAGE0 ?? `HTTP ${res.status}`}`);
  }
  for (let i = 0; out[`L_CURRENCYCODE${i}`]; i++) {
    if (out[`L_CURRENCYCODE${i}`] === 'USD') return Math.round(Number(out[`L_AMT${i}`]) * 100);
  }
  throw new Error('PayPal GetBalance returned no USD balance');
}

/** withSandboxPage only needs a profile name, the login email and the password variable. */
const asSandboxAccount = (biz: BusinessAccount): Account => ({
  username: `biz-${biz.username}`,
  name: biz.name,
  password: '',
  sandboxEmail: biz.sandboxEmail,
  sandboxPasswordEnv: biz.sandboxPasswordEnv,
});

const onLoginPage = async (page: Page) => /\/signin/.test(page.url()) || (await page.locator('#email, #password').count()) > 0;

function browserBalance(biz: BusinessAccount): Promise<number> {
  return withSandboxPage(asSandboxAccount(biz), async (page, password) => {
    let lastError: unknown;
    for (const path of PAGES) {
      await page.goto(`${SANDBOX}${path}`, { waitUntil: 'domcontentloaded' });
      if (await onLoginPage(page)) {
        // A business lands outside /myaccount/ after logging in: wait until we leave the sign-in page.
        await login(page, biz.sandboxEmail, password, () => page.waitForURL((url) => !/\/signin/.test(url.pathname), { timeout: 45_000 }));
        await page.goto(`${SANDBOX}${path}`, { waitUntil: 'domcontentloaded' });
      }
      // PayPal's pages keep polling and never go network-idle (waiting for that took ~90 s), so read
      // the page until the balance shows up (usually within a few seconds).
      // Only an amount next to its balance label counts, so a half-drawn page never gives a wrong number.
      const deadline = Date.now() + 20_000;
      let text = '';
      for (;;) {
        text = await page.locator('body').innerText().catch(() => '');
        const cents = parseLabeledBalance(text);
        if (cents !== null) return cents;
        if (Date.now() > deadline) break;
        await page.waitForTimeout(750);
      }
      try {
        return parseBalance(text); // no label on this page: the old rule (first amount on the page)
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('Could not find the balance on the PayPal sandbox page');
  });
}
