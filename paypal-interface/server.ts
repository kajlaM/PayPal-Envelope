// PayPal-style customer site (the front end) on top of the PayPalVault API (the back end).
//   npx tsx paypal-interface/server.ts   ->  http://localhost:3000
// It serves the static site, logs customers in, links their PayPal sandbox account, and drives the
// PayPalVault API for everything vault related (create, fund, agent, approvals, refunds).
// Each customer maps to a PayPalVault user (by PayPal sandbox email), so they only see their own vaults.

import { createHmac, timingSafeEqual } from 'node:crypto';
import http, { type IncomingMessage } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import https from 'node:https';
import type { Duplex } from 'node:stream';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { completeFunding, failFunding, prisma, startFunding } from '@paypalvault/db'; // also loads the repo-root .env
import { PayPalApiError } from '@paypalvault/paypal';
import { SAVINGS_INTERVALS, savingsExpiry, verifyApprovalLink, type ApprovalAction } from '@paypalvault/policy';
import { BRYNTUM_OUT, ensureBryntum } from '../scripts/build-bryntum.mjs';
import { ACCOUNTS, BUSINESS_ACCOUNTS, type Account, type BusinessAccount } from './accounts.ts';
import { accountFor, baseBusiness, checkSignUpLogin, isBusiness, createSignUp, findSignUp, recipientPasswordOk, setAlertRecipient, signUpPasswordOk, SIGNUP_PREFIX, SignUpError } from './signups.ts';
import * as business from './business.ts';
import { businessBalance } from './business-balance.ts';
import { connection as transactionsConnection, syncTransactions } from './business-transactions.ts';
import { saveNote } from './business-notes.ts';
import { autoLink, chargeSavedPayPal, finishLink, getLink, LinkError, startLink, unlink, type PayPalLink } from './paypal-link.ts';
import { balanceChanged, sandboxBalance } from './sandbox-balance.ts';
import { PayPalVaultError, vaultApi } from './vault-api.ts';

const PORT = Number(process.env.INTERFACE_PORT ?? 3000);
const PAYPALVAULT_API = (process.env.PAYPALVAULT_API_URL?.trim() || `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, '');
const SECRET = process.env.INTERNAL_API_KEY?.trim();
if (!SECRET) throw new Error('Set INTERNAL_API_KEY in .env (used to sign login cookies)');

const COOKIE = 'pp_session';
const SESSION_MS = 12 * 60 * 60_000;

class HttpError extends Error {
  constructor(public status: number, public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

// ---------- Session cookie: "<username>.<expiry>.<hmac>" ----------

const sign = (value: string) => createHmac('sha256', SECRET).update(value).digest('base64url');

function sessionCookie(username: string) {
  const value = `${username}.${Date.now() + SESSION_MS}`;
  return `${value}.${sign(value)}`;
}

function readSession(req: Request): Account | null {
  const raw = req.headers.cookie?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [username, expiry, mac] = raw.split('.');
  if (!username || !expiry || !mac) return null;
  const expected = Buffer.from(sign(`${username}.${expiry}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expiry) < Date.now()) return null;
  if (username.startsWith(SIGNUP_PREFIX)) {
    // A sign-up: the shared demo customer, shown with their own name (signups.ts).
    const signup = findSignUp(username.slice(SIGNUP_PREFIX.length));
    return signup && !isBusiness(signup) ? accountFor(signup) : null;
  }
  return ACCOUNTS[username] ?? null;
}

// Business logins use the same signed cookie with a "biz-" prefix, so they never match a personal account.
const BIZ_PREFIX = 'biz-';

function readBusiness(req: Request): BusinessAccount | null {
  const raw = req.headers.cookie?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [username, expiry, mac] = raw?.split('.') ?? [];
  if (!username?.startsWith(BIZ_PREFIX) || !expiry || !mac) return null;
  const expected = Buffer.from(sign(`${username}.${expiry}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expiry) < Date.now()) return null;
  return businessFor(username.slice(BIZ_PREFIX.length))?.biz ?? null;
}

/** "audiostore", or "su-<id>" for a business sign-up (the shared demo shop, with the person's name). */
function businessFor(key: string): { biz: BusinessAccount; personName: string | null } | null {
  if (key.startsWith(SIGNUP_PREFIX)) {
    const signup = findSignUp(key.slice(SIGNUP_PREFIX.length));
    return signup && isBusiness(signup) ? { biz: baseBusiness(), personName: signup.name } : null;
  }
  const biz = BUSINESS_ACCOUNTS[key];
  return biz ? { biz, personName: null } : null;
}

/** The person's own name on a business sign-up's session, else null. */
function businessPersonName(req: Request): string | null {
  const raw = req.headers.cookie?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const username = raw?.split('.')[0] ?? '';
  return readBusiness(req) && username.startsWith(BIZ_PREFIX) ? businessFor(username.slice(BIZ_PREFIX.length))?.personName ?? null : null;
}

function loggedInBusiness(req: Request): BusinessAccount {
  const biz = readBusiness(req);
  if (!biz) throw new HttpError(401, 'NOT_LOGGED_IN');
  return biz;
}

function setCookie(req: Request, res: Response, value: string, maxAgeMs: number) {
  const secure = req.secure ? '; Secure' : ''; // https when opened through the Cloudflare tunnel
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}

function passwordOk(account: { password: string }, password: unknown) {
  // Someone who signed up confirms payments with their own password, not the shared account's.
  const signUp = signUpPasswordOk(account as Account, password);
  if (signUp !== null) return signUp;
  const given = Buffer.from(String(password ?? ''));
  const expected = Buffer.from(account.password);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function loggedIn(req: Request): Account {
  const account = readSession(req);
  if (!account) throw new HttpError(401, 'NOT_LOGGED_IN');
  return account;
}

// ---------- Customer <-> PayPalVault user, balance ----------

/** The PayPalVault user row for this customer. Created on first login, matched by sandbox email. */
async function paypalvaultUser(account: Account) {
  return prisma.user.upsert({
    where: { paypalEmail: account.sandboxEmail },
    update: { name: account.name }, // alert emails greet the customer by this name
    create: { name: account.name, paypalEmail: account.sandboxEmail },
  });
}

// ---------- PayPal link, made automatically after login ----------
// The customer already logged in as their sandbox account, so the site links that same account in
// the background (paypal-link.ts, autoLink) instead of asking them to log in to PayPal again.

const linking = new Map<string, Promise<PayPalLink>>(); // username -> link in progress
const linkErrors = new Map<string, string>(); // username -> why the last automatic link failed

const siteUrl = (req: Request) => `${req.protocol}://${req.get('host')}`;

/** The customer's saved link, or a new one made in the hidden browser. One attempt at a time. */
function ensureLinked(account: Account, site: string): Promise<PayPalLink> {
  const running = linking.get(account.username);
  if (running) return running;
  const run = (async () => (await getLink(account.username)) ?? autoLink(account, site))()
    .then((link) => {
      linkErrors.delete(account.username);
      return link;
    })
    .catch((err) => {
      const message = err instanceof PayPalApiError ? err.body?.message ?? err.message : (err as Error).message.split('\n')[0]!;
      linkErrors.set(account.username, message);
      console.error(`Linking PayPal for ${account.username} failed:`, message);
      throw err;
    })
    .finally(() => linking.delete(account.username));
  linking.set(account.username, run);
  run.catch(() => undefined); // callers that don't wait still get the error through linkErrors
  return run;
}

/** Starts the automatic link if the customer has none yet. `retry` also retries after a failure. */
async function startLinkingIfNeeded(account: Account, req: Request, retry: boolean) {
  if (await getLink(account.username)) return;
  if (!retry && linkErrors.has(account.username)) return;
  ensureLinked(account, siteUrl(req)).catch(() => undefined);
}

async function profile(account: Account) {
  const user = await paypalvaultUser(account);
  const link = await getLink(account.username);
  return {
    username: account.username,
    name: account.name,
    sandboxEmail: account.sandboxEmail,
    userId: user.id,
    paypalLinked: link ? { email: link.email, linkedAt: link.linkedAt } : null,
    paypalLinking: !link && linking.has(account.username),
    paypalLinkError: link ? null : linkErrors.get(account.username) ?? null,
    // "Ask a friend": the other demo customers, offered as suggestions (any PayPal email works).
    friends: Object.values(ACCOUNTS).filter((a) => a.username !== account.username).map((a) => ({ name: a.name, email: a.sandboxEmail })),
  };
}

// ---------- PayPalVault API ----------

// Calls go through the APIMatic-generated SDK (vault-api.ts).

/** The vault, if it belongs to this customer. */
async function ownVault(account: Account, vaultId: string) {
  const { userId } = await profile(account);
  const vault = await vaultApi.getVault(vaultId).catch((err) => {
    if (err instanceof PayPalVaultError && err.status === 404) throw new HttpError(404, 'VAULT_NOT_FOUND');
    throw err;
  });
  if (vault.userId !== userId) throw new HttpError(404, 'VAULT_NOT_FOUND');
  return vault;
}

/** Starts the vault's AI agent in the background; its steps stream to the browser over Socket.IO. */
function startAgent(vaultId: string) {
  vaultApi.runAgent(vaultId).catch((err) => {
    if (!(err instanceof PayPalVaultError && err.body.error === 'AGENT_ALREADY_RUNNING')) {
      console.error(`Agent for vault ${vaultId} failed:`, (err as Error).message);
    }
  });
}

/**
 * Pays `amountCents` into the vault from the customer's saved PayPal account and credits it through
 * the PayPalVault ledger, the same entries the PayPal button flow writes (FUND, then COMPLETED + ACTIVE).
 * Used for the first payment and for top-ups after a policy change (each with its own `requestId`,
 * so a retry returns the same PayPal order instead of paying twice).
 */
async function payIntoVault(vault: { id: string; name: string }, amountCents: number, link: PayPalLink, requestId?: string) {
  const order = await chargeSavedPayPal({
    paymentTokenId: link.paymentTokenId,
    vaultId: vault.id,
    amountCents,
    description: `Fund PayPalVault vault: ${vault.name}`,
    requestId,
  });
  const known = await prisma.ledgerEntry.findUnique({ where: { paypalRef: order.orderId } });
  if (!known) await startFunding(vault.id, amountCents, order.orderId);

  if (order.status === 'COMPLETED') {
    // Paid in one step (saved account): credit the vault like the capture route does, then tell
    // PayPalVault so live updates and the "vault is live" email go out.
    if (order.captureStatus === 'COMPLETED') {
      await completeFunding(order.orderId);
      await vaultApi.recordFunding(vault.id, order.orderId).catch((err) => {
        console.error(`Could not report funding of vault ${vault.id}:`, (err as Error).message);
      });
    } else if (order.captureStatus === 'DECLINED' || order.captureStatus === 'FAILED') {
      await failFunding(order.orderId, `capture ${order.captureStatus}`);
      throw new HttpError(402, 'PAYMENT_DECLINED', { message: 'PayPal declined the payment.' });
    } else {
      throw new HttpError(202, 'PAYMENT_PENDING', { message: `PayPal is still processing the payment (${order.captureStatus}).` });
    }
  } else {
    // Order approved by the saved account but not captured yet: let PayPalVault capture and credit it.
    await vaultApi.captureFunding(vault.id, order.orderId);
  }
}

/** The customer's saved PayPal link (made after login); waits for it if it is still being made. */
async function linkFor(account: Account, req: Request) {
  return ensureLinked(account, siteUrl(req)).catch((err) => {
    throw new HttpError(409, 'PAYPAL_NOT_LINKED', { message: `Could not connect your PayPal account: ${linkErrors.get(account.username) ?? (err as Error).message}` });
  });
}

/** Refuses a payment bigger than the PayPal balance (when the balance could be read). */
async function checkBalance(account: Account, amountCents: number) {
  const balance = await sandboxBalance(account, { force: true });
  // Unclaimed money can't be spent; PayPal charges the account's bank or card then, so don't block.
  if (balance.status === 'OK' && !balance.unclaimed && amountCents > balance.cents) {
    throw new HttpError(402, 'INSUFFICIENT_FUNDS', { message: 'Not enough money in your PayPal balance.' });
  }
}

/** Amount + description -> policy written by the PayPalVault. The amount the customer typed is the budget. */
async function draftPolicy(amountInput: unknown, descriptionInput: unknown, controlInput?: unknown, paymentInput?: unknown) {
  const amount = Math.round(Number(amountInput) * 100) / 100;
  const description = String(descriptionInput ?? '').trim();
  if (!(amount >= 1) || amount > 10_000) throw new HttpError(400, 'INVALID_AMOUNT', { message: 'Enter an amount between $1 and $10,000.' });
  if (description.length < 5) throw new HttpError(400, 'DESCRIPTION_TOO_SHORT', { message: 'Describe what the envelope is for.' });

  const text = `${description}. Vault budget: $${amount.toFixed(2)}.`;
  const draft = await vaultApi.compilePolicy(text);
  // No limit may exceed the amount.
  const rules = draft.policy.rules;
  draft.policy.allocated_budget = amount;
  rules.max_single_transaction = Math.min(rules.max_single_transaction, amount);
  setControl(draft.policy, controlInput, draft.warnings);
  setPayment(draft.policy, paymentInput, draft.warnings);
  return { ...draft, sourceText: text };
}

/**
 * How the customer pays, as picked on the form ({ mode: 'NOW' | 'OVER_TIME', amount, every }), wins over
 * what the AI read. Over time, the vault lasts until the last payment (plus time to shop).
 */
function setPayment(policy: any, payment: any, warnings: string[] = []) {
  if (payment?.mode === 'NOW') {
    if (policy.vault_type === 'SAVINGS') {
      throw new HttpError(400, 'SAVINGS_PAID_OVER_TIME', { message: 'A savings envelope is paid in bit by bit: pick "Pay over time".' });
    }
    delete policy.savings;
  } else if (payment?.mode === 'OVER_TIME') {
    if (policy.vault_type === 'UTILITY') throw new HttpError(400, 'BILLS_PAID_NOW', { message: 'Bill envelopes are paid in full now.' });
    const amount = Math.round(Number(payment.amount) * 100) / 100;
    if (!(amount > 0)) throw new HttpError(400, 'INVALID_PAYMENT_AMOUNT', { message: 'Enter how much to pay in each time.' });
    if (amount >= policy.allocated_budget) throw new HttpError(400, 'PAYMENT_NOT_SMALLER', { message: 'Each payment must be smaller than the envelope amount (or pay it all now).' });
    if (!SAVINGS_INTERVALS.includes(payment.every)) throw new HttpError(400, 'INVALID_INTERVAL', { message: 'Pick how often to pay in.' });
    policy.savings = { amount_per_payment: amount, every: payment.every };
  }
  if (policy.savings) {
    const needed = savingsExpiry(policy, new Date());
    if (needed.getTime() - Date.now() > 730 * 86_400_000) {
      throw new HttpError(400, 'PLAN_TOO_LONG', { message: 'That plan takes longer than 2 years. Pay more each time, or more often.' });
    }
    if (new Date(policy.rules.expiry_timestamp) < needed) {
      policy.rules.expiry_timestamp = needed.toISOString();
      warnings.push('The vault lasts until after the last payment.');
    }
  }
}

const CONTROL_MODES = ['ASK_ME', 'ASK_ABOVE', 'AUTOPILOT'];

/**
 * The control setting the customer picked on the form ({ mode, above }) wins over what the AI read
 * from the description. "Ask above" an amount the vault can never reach means it never asks: Autopilot.
 */
function setControl(policy: any, control: any, warnings: string[] = []) {
  const rules = policy.rules;
  if (control && CONTROL_MODES.includes(control.mode)) {
    rules.control_mode = control.mode;
    if (control.mode === 'ASK_ABOVE') {
      const above = Math.round(Number(control.above) * 100) / 100;
      if (!(above > 0)) throw new HttpError(400, 'INVALID_APPROVAL_AMOUNT', { message: 'Enter the amount above which the AI must ask you.' });
      rules.human_approval_above = above;
    } else {
      delete rules.human_approval_above;
    }
  }
  if (rules.human_approval_above !== undefined && rules.human_approval_above >= policy.allocated_budget) delete rules.human_approval_above;
  if (rules.control_mode === 'ASK_ABOVE' && rules.human_approval_above === undefined) {
    rules.control_mode = 'AUTOPILOT';
    warnings.push('The approval amount is not below the vault amount, so the AI never needs to ask: set to Autopilot.');
  }
}

// ---------- Pass-through to the PayPalVault API ----------
// This site is the only public URL (e.g. the Cloudflare tunnel). The browser's live updates
// (/socket.io, incl. the WebSocket upgrade) and PayPal's webhooks (/webhooks) reach the API through it.

const PROXIED = ['/socket.io/', '/webhooks/'];
const isProxied = (url = '') => PROXIED.some((prefix) => url.startsWith(prefix));

function apiRequest(req: IncomingMessage) {
  const target = new URL(req.url ?? '/', PAYPALVAULT_API);
  return (target.protocol === 'https:' ? https : http).request(target, {
    method: req.method,
    headers: { ...req.headers, host: target.host },
  });
}

/** The platform's live socket carries every customer's vault events: never for a business login. */
const businessOnSocket = (req: IncomingMessage) => Boolean(req.url?.startsWith('/socket.io') && readBusiness(req as Request));

function proxyToApi(req: Request, res: Response) {
  req.url = req.originalUrl; // Express strips the mount path
  if (businessOnSocket(req)) return res.status(403).json({ error: 'NOT_FOR_BUSINESS' });
  const upstream = apiRequest(req);
  upstream.on('response', (apiRes) => {
    res.writeHead(apiRes.statusCode ?? 502, apiRes.headers);
    apiRes.pipe(res);
  });
  upstream.on('error', (err) => {
    if (res.headersSent) return res.destroy();
    res.status(502).json({ error: 'BACKEND_UNAVAILABLE', message: err.message });
  });
  req.pipe(upstream);
}

function proxyUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  if (!isProxied(req.url) || businessOnSocket(req)) return socket.destroy();
  const upstream = apiRequest(req);
  upstream.on('upgrade', (apiRes, apiSocket, apiHead) => {
    const lines = [`HTTP/1.1 101 ${apiRes.statusMessage ?? 'Switching Protocols'}`];
    for (let i = 0; i < apiRes.rawHeaders.length; i += 2) lines.push(`${apiRes.rawHeaders[i]}: ${apiRes.rawHeaders[i + 1]}`);
    socket.write(`${lines.join('\r\n')}\r\n\r\n`);
    if (apiHead.length) socket.write(apiHead);
    if (head.length) apiSocket.write(head);
    apiSocket.on('error', () => socket.destroy());
    socket.on('error', () => apiSocket.destroy());
    apiSocket.pipe(socket).pipe(apiSocket);
  });
  upstream.on('response', (apiRes) => {
    socket.end(`HTTP/1.1 ${apiRes.statusCode} ${apiRes.statusMessage}\r\n\r\n`);
  });
  upstream.on('error', () => socket.destroy());
  upstream.end();
}

// ---------- Small HTML page shown in the PayPal popup after linking ----------

function popupPage(res: Response, message: { ok: boolean; email?: string; error?: string }) {
  const text = message.ok ? `PayPal linked (${message.email}). You can close this window.` : message.error ?? 'Linking was cancelled.';
  res.type('html').send(`<!doctype html><meta charset="utf-8"><title>PayPal</title>
<body style="font-family:-apple-system,sans-serif;padding:32px;color:#0C0C0D"><p>${text.replace(/[<>&]/g, '')}</p>
<script>
  if (window.opener) { window.opener.postMessage(${JSON.stringify({ type: 'paypal-link', ...message })}, location.origin); window.close(); }
</script></body>`);
}

// ---------- Routes ----------

const app = express();
app.set('trust proxy', 'loopback'); // cloudflared runs locally: honour its X-Forwarded-Proto/Host
app.use(PROXIED.map((prefix) => prefix.slice(0, -1)), proxyToApi); // before express.json: webhooks need the raw body
app.use(express.json());

app.get('/health', async (_req, res) => {
  const api = await fetch(`${PAYPALVAULT_API}/health`).then((r) => r.ok).catch(() => false);
  res.status(api ? 200 : 503).json({ ok: api, site: true, api });
});

app.post('/auth/login', async (req, res) => {
  // Like PayPal: log in with the sandbox email, or with the short username.
  const login = String(req.body?.username ?? '').trim().toLowerCase();
  const biz = BUSINESS_ACCOUNTS[login] ?? Object.values(BUSINESS_ACCOUNTS).find((b) => b.loginEmails.some((e) => e.toLowerCase() === login));
  if (biz) {
    if (!passwordOk(biz, req.body?.password)) return res.status(401).json({ error: 'INVALID_LOGIN', message: 'Wrong email/username or password.' });
    setCookie(req, res, sessionCookie(`${BIZ_PREFIX}${biz.username}`), SESSION_MS);
    return res.json({ kind: 'business', name: biz.name, redirect: '/business' });
  }
  const account = ACCOUNTS[login] ?? Object.values(ACCOUNTS).find((a) => a.sandboxEmail.toLowerCase() === login);
  if (!account) {
    // Someone who signed up on the site (signups.ts) logs in with their own email.
    const signup = checkSignUpLogin(login, String(req.body?.password ?? ''));
    if (!signup) return res.status(401).json({ error: 'INVALID_LOGIN', message: 'Wrong email/username or password.' });
    return logInSignUp(req, res, signup);
  }
  if (!passwordOk(account, req.body?.password)) {
    return res.status(401).json({ error: 'INVALID_LOGIN', message: 'Wrong email/username or password.' });
  }
  await startLinkingIfNeeded(account, req, true);
  const me = await profile(account);
  setAlertRecipient(account, null); // the demo customer itself: alerts go back to ALERT_RECIPIENTS
  setCookie(req, res, sessionCookie(account.username), SESSION_MS);
  res.json(me);
});

/** Opens the shared demo customer for a sign-up; their alerts now go to their own email. */
async function logInSignUp(req: Request, res: Response, signup: NonNullable<ReturnType<typeof findSignUp>>) {
  if (isBusiness(signup)) {
    // Business sign-up: the shared demo shop's seller dashboard.
    setCookie(req, res, sessionCookie(`${BIZ_PREFIX}${SIGNUP_PREFIX}${signup.id}`), SESSION_MS);
    return res.json({ kind: 'business', name: signup.name, redirect: '/business' });
  }
  const account = accountFor(signup);
  await startLinkingIfNeeded(account, req, true);
  const me = await profile(account);
  setAlertRecipient(account, signup);
  setCookie(req, res, sessionCookie(`${SIGNUP_PREFIX}${signup.id}`), SESSION_MS);
  res.json({ ...me, email: signup.email });
}

// Sign up: name, email, password (twice). Logs straight in.
app.post('/auth/signup', async (req, res) => {
  let signup;
  try {
    signup = createSignUp(req.body ?? {});
  } catch (err) {
    if (err instanceof SignUpError) return res.status(400).json({ error: 'INVALID_SIGNUP', message: err.message });
    throw err;
  }
  await logInSignUp(req, res, signup);
});

// PayPal JS SDK settings for the Pay Later button (the client id is public by design).
app.get('/config', (_req, res) => {
  res.json({ paypalClientId: process.env.VITE_PAYPAL_CLIENT_ID?.trim() || process.env.PAYPAL_CLIENT_ID?.trim() || null });
});

app.post('/auth/logout', (req, res) => {
  setCookie(req, res, '', 0);
  res.json({ ok: true });
});

app.get('/auth/me', async (req, res) => {
  const biz = readBusiness(req);
  if (biz) return res.json({ kind: 'business', name: biz.name, redirect: '/business' });
  const account = loggedIn(req);
  await startLinkingIfNeeded(account, req, false); // e.g. still logged in from before a restart
  res.json(await profile(account));
});

// Live PayPal balance, read from sandbox.paypal.com (slow on a fresh login, so it has its own route).
app.get('/me/balance', async (req, res) => {
  res.json(await sandboxBalance(loggedIn(req), { force: req.query.fresh === '1' }));
});

// ---- PayPal account link (once per customer) ----

const pendingLinks = new Map<string, string>(); // username -> setup token id

// Retry the automatic link (after it failed, e.g. a wrong sandbox password in .env).
app.post('/paypal/link/auto', async (req, res) => {
  const account = loggedIn(req);
  await startLinkingIfNeeded(account, req, true);
  res.json(await profile(account));
});

app.post('/paypal/link/start', async (req, res) => {
  const account = loggedIn(req);
  const base = siteUrl(req);
  const { setupTokenId, approveUrl } = await startLink({ returnUrl: `${base}/paypal/link/return`, cancelUrl: `${base}/paypal/link/cancel` });
  pendingLinks.set(account.username, setupTokenId);
  res.json({ approveUrl });
});

app.get('/paypal/link/return', async (req, res) => {
  const account = readSession(req);
  const tokenId = String(req.query.approval_token_id ?? '');
  if (!account || !tokenId || pendingLinks.get(account.username) !== tokenId) {
    return popupPage(res, { ok: false, error: 'This link request expired. Start again from the site.' });
  }
  pendingLinks.delete(account.username);
  try {
    const link = await finishLink(account.username, tokenId, account.sandboxEmail);
    popupPage(res, { ok: true, email: link.email });
  } catch (err) {
    popupPage(res, { ok: false, error: err instanceof LinkError ? err.message : `Linking failed: ${(err as Error).message}` });
  }
});

app.get('/paypal/link/cancel', (_req, res) => popupPage(res, { ok: false, error: 'Linking was cancelled.' }));

app.post('/paypal/unlink', async (req, res) => {
  await unlink(loggedIn(req).username);
  res.json({ ok: true });
});

// ---- Vaults ----

// The logged-in customer's vaults, straight from the PayPalVault API.
app.get('/me/vaults', async (req, res) => {
  const { userId } = await profile(loggedIn(req));
  const vaults: { userId: string }[] = await vaultApi.listVaults();
  res.json(vaults.filter((v) => v.userId === userId));
});

// Step 1: amount + description -> AI writes the policy (PayPalVault compiler). Nothing is saved.
app.post('/me/vaults/preview', async (req, res) => {
  loggedIn(req);
  res.json(await draftPolicy(req.body?.amount, req.body?.description, req.body?.control, req.body?.payment));
});

// How a new vault gets its money:
//   PAYPAL    taken from the customer's saved PayPal account right away (no popup)
//   PAYLATER  PayPal Pay Later: the vault gets the full amount now, the customer pays PayPal back in parts
//             (the vault is created here; the browser then opens the PayPal Pay Later window)
//   FRIEND    a PayPal money request to a friend's PayPal email; their payment goes straight into the vault
const FUNDING_METHODS = ['PAYPAL', 'PAYLATER', 'FRIEND'] as const;
type FundingMethod = (typeof FUNDING_METHODS)[number];

/** Sends the "Ask a friend" PayPal money request for a vault waiting for its money. */
function askFriend(account: Account, vaultId: string, friendEmail: unknown, message: unknown) {
  return vaultApi.createFundRequest(vaultId, {
    payerEmail: String(friendEmail ?? '').trim(),
    message: typeof message === 'string' && message.trim() ? message.trim() : undefined,
    requesterName: account.name,
  });
}

// ---- Creating a vault happens once ----
// The review screen sends a one-time `createKey`. The same key again (double send, or a retry after
// an error that came after the vault was made) gets the first answer back instead of a second vault.
// And the same vault (same name and amount) again within 2 minutes is refused, whatever the key.
const CREATE_KEEP_MS = 10 * 60_000;
const DUPLICATE_WINDOW_MS = 2 * 60_000;
type Created = { status: number; body: unknown };
const creates = new Map<string, Promise<Created>>();

// Step 2: password confirmed -> create the vault, fund it the chosen way, start the AI.
// Pay Later needs no password here: no money moves until the customer logs in and approves on PayPal,
// so that PayPal login is the one sign-in (same as "Fund this vault" -> Pay Later).
app.post('/me/vaults', async (req, res) => {
  const account = loggedIn(req);
  if (req.body?.funding !== 'PAYLATER' && !passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const createKey = typeof req.body?.createKey === 'string' && /^[\w-]{8,100}$/.test(req.body.createKey) ? `${account.username}:${req.body.createKey}` : null;
  const earlier = createKey ? creates.get(createKey) : undefined;
  if (earlier) {
    const first = await earlier; // a failed first try rethrows its own error here
    return res.status(first.status).json(first.body);
  }
  const job = createVault(account, req);
  if (createKey) {
    creates.set(createKey, job);
    const forget = () => setTimeout(() => creates.delete(createKey), CREATE_KEEP_MS).unref();
    job.then(forget, (err) => {
      // Failed after the vault was made (it carries vaultId): keep the answer, so a retry can't make a
      // second vault. Failed before (e.g. balance too low): let the customer simply try again.
      if (err instanceof HttpError && err.extra.vaultId) forget();
      else creates.delete(createKey);
    });
  }
  const done = await job;
  res.status(done.status).json(done.body);
});

async function createVault(account: Account, req: Request): Promise<Created> {
  const funding: FundingMethod = req.body?.funding ?? 'PAYPAL';
  if (!FUNDING_METHODS.includes(funding)) throw new HttpError(400, 'INVALID_FUNDING', { message: 'Pick how to fund the envelope.' });
  const policy = req.body?.policy;
  if (!policy || typeof policy !== 'object' || !policy.rules || !policy.vault_name || !(Number(policy.allocated_budget) > 0)) {
    throw new HttpError(400, 'INVALID_POLICY', { message: 'Go back and let the AI write the rules first.' });
  }
  const plan = policy.savings;
  if (plan && funding !== 'PAYPAL') {
    throw new HttpError(400, 'SAVINGS_PAID_BY_OWNER', { message: 'An envelope paid in over time is paid from your own PayPal.' });
  }
  if (funding === 'FRIEND' && !String(req.body?.friendEmail ?? '').trim()) {
    throw new HttpError(400, 'FRIEND_EMAIL_REQUIRED', { message: "Enter your friend's PayPal email." });
  }
  const { userId, sandboxEmail } = await profile(account);
  if (funding === 'FRIEND' && String(req.body.friendEmail).trim().toLowerCase() === sandboxEmail.toLowerCase()) {
    throw new HttpError(400, 'CANNOT_ASK_YOURSELF', { message: 'That is your own PayPal. Pick "Pay with PayPal" instead.' });
  }
  const twin = await prisma.vault.findFirst({
    where: {
      userId,
      name: String(req.body?.policy?.vault_name ?? ''),
      budgetCents: Math.round(Number(req.body?.policy?.allocated_budget) * 100),
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (twin) {
    throw new HttpError(409, 'DUPLICATE_VAULT', {
      message: `You created "${twin.name}" a moment ago, so no second one was made. Open it from your envelopes.`,
      vaultId: twin.id,
    });
  }
  // Only "Pay with PayPal" takes money from the saved account (Pay Later and friends pay on PayPal itself).
  const link = funding === 'PAYPAL' ? await linkFor(account, req) : null;
  // Paid over time: only the first payment is taken now.
  const firstCents = Math.round(Number(plan ? Math.min(plan.amount_per_payment, req.body.policy.allocated_budget) : req.body?.policy?.allocated_budget) * 100);
  if (funding === 'PAYPAL') await checkBalance(account, firstCents);

  const vault = await vaultApi.createVault({ policy: req.body.policy, sourceText: req.body.sourceText, userId });
  // A sign-up's vault emails go to them, even after someone else logs into the shared demo account.
  // Stored in the database: on Render the site and the API have separate disks, so a file wouldn't reach it.
  const creator = findSignUp((account as { signupId?: string }).signupId ?? '');
  if (creator) await prisma.vault.update({ where: { id: vault.id }, data: { alertEmail: creator.email } });
  // Answer from here on even if reading the vault back fails: it exists, so a retry must not make another.
  const created = async (extra: Record<string, unknown> = {}): Promise<Created> => ({
    status: 201,
    body: { ...(await ownVault(account, vault.id).catch(() => vault)), ...extra },
  });
  if (funding === 'PAYLATER') return created({ funding });
  if (funding === 'FRIEND') {
    try {
      const request = await askFriend(account, vault.id, req.body.friendEmail, req.body.friendMessage);
      return created({ funding, request });
    } catch (err) {
      // The vault stays "awaiting funding": it can be funded another way from its page.
      const message = err instanceof PayPalVaultError ? err.message : (err as Error).message;
      throw new HttpError(502, 'REQUEST_FAILED', { message, vaultId: vault.id });
    }
  }
  try {
    if (vault.savingsPerPaymentCents !== null && vault.savingsPerPaymentCents !== undefined) {
      // PayPalVault takes it from the linked account (the same way it takes every later payment).
      const first = await vaultApi.chargeSavingsNow(vault.id);
      if (first.status === 'ACTIVE' && vault.type !== 'SAVINGS') startAgent(vault.id);
    } else {
      await payIntoVault(vault, vault.budgetCents, link!);
      startAgent(vault.id); // the AI takes over right away (watch mode keeps shopping vaults looking)
    }
  } catch (err) {
    // The vault stays "awaiting funding"; PayPalVault's sweeper closes it when it expires.
    if (err instanceof HttpError) throw Object.assign(err, { extra: { ...err.extra, vaultId: vault.id } });
    const message = err instanceof PayPalApiError ? err.body?.message ?? err.message : (err as Error).message;
    throw new HttpError(402, 'PAYMENT_FAILED', { message, vaultId: vault.id });
  } finally {
    balanceChanged(account);
  }
  return created();
}

// Statement: every money movement across all of this customer's vaults (read-only, newest first).
app.get('/me/activity', async (req, res) => {
  const { userId } = await profile(loggedIn(req));
  const entries = await prisma.ledgerEntry.findMany({
    where: { vault: { userId } },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    include: { vault: { select: { id: true, name: true, type: true } }, merchant: { select: { name: true } } },
  });
  res.json(entries.map((e) => ({
    id: e.id,
    at: e.createdAt.toISOString(),
    vaultId: e.vault.id,
    vault: e.vault.name,
    vaultType: e.vault.type,
    type: e.type,
    amountCents: e.type === 'FUND' ? e.amountCents : -e.amountCents, // into the vault +, out of it -
    status: e.status,
    merchant: e.merchant?.name ?? null,
    paidVia: e.paidVia,
    note: e.note,
    paypalRef: e.paypalTxnId ?? e.paypalRef,
    paypalCheck: e.paypalCheck, // "Verified by PayPal" (VERIFIED, WAITING, MISMATCH, UNCHECKED or null)
    paypalCheckNote: e.paypalCheckNote,
  })));
});

// Start a vault from a product link: Channel3 product, stores and price history (can take ~20 s).
app.post('/me/product-lookup', async (req, res) => {
  loggedIn(req);
  res.json(await vaultApi.lookupProduct(String(req.body?.url ?? '').trim()));
});

// "Verify now": checks this vault's payments against PayPal's own records (read-only).
app.post('/me/vaults/:id/verify', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await vaultApi.verifyVault(vault.id));
});

// All of this customer's vaults with full details, in one go (the calendar needs every one).
app.get('/me/vaults/details', async (req, res) => {
  const { userId } = await profile(loggedIn(req));
  res.json(await vaultApi.listVaultDetails(userId));
});

app.get('/me/vaults/:id', async (req, res) => {
  res.json(await ownVault(loggedIn(req), req.params.id));
});

// ---- Fund a vault that is waiting for its money ----

/** The vault, if it belongs to this customer and still waits for its money. */
async function unfundedVault(account: Account, vaultId: string) {
  const vault = await ownVault(account, vaultId);
  if (vault.status !== 'PENDING_FUNDING') throw new HttpError(409, 'VAULT_ALREADY_FUNDED', { message: 'This envelope already has its money.' });
  return vault;
}

function noOpenRequest(vault: { fundRequests?: { status: string; payerEmail: string }[] }) {
  const open = vault.fundRequests?.find((r) => r.status === 'OPEN');
  if (open) throw new HttpError(409, 'FRIEND_REQUEST_OPEN', { message: `${open.payerEmail} was asked to fund this envelope. Cancel that request first.` });
}

// Pay with PayPal: from the saved PayPal account, no popup. Moves money, so it needs the password.
app.post('/me/vaults/:id/fund/paypal', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await unfundedVault(account, req.params.id);
  noOpenRequest(vault);
  if (vault.savingsPerPaymentCents !== null && vault.savingsPerPaymentCents !== undefined) {
    throw new HttpError(409, 'SAVINGS_PLAN', { message: 'This envelope is paid in over time: use "Pay now" in its savings plan.' });
  }
  const link = await linkFor(account, req);
  const amountCents = vault.budgetCents - vault.balanceCents;
  await checkBalance(account, amountCents);
  try {
    // One PayPal request id per attempt: a double click returns the same order, a retry after a
    // declined payment (a FAILED entry) gets a new one.
    const attempt = (vault.ledger ?? []).filter((e: { type: string }) => e.type === 'FUND').length;
    await payIntoVault(vault, amountCents, link, `fund-saved-${vault.id}-attempt-${attempt}`);
  } finally {
    balanceChanged(account);
  }
  startAgent(vault.id);
  res.json(await ownVault(account, vault.id));
});

// PayPal Pay Later (JS SDK button): PayPalVault makes the order, the customer approves it on PayPal
// choosing Pay Later, then PayPalVault captures it. The vault gets the full amount at once.
app.post('/me/vaults/:id/fund/order', async (req, res) => {
  const vault = await unfundedVault(loggedIn(req), req.params.id);
  noOpenRequest(vault);
  res.json(await vaultApi.createFundingOrder(vault.id));
});

app.post('/me/vaults/:id/fund/capture', async (req, res) => {
  const account = loggedIn(req);
  const vault = await ownVault(account, req.params.id);
  const orderId = String(req.body?.orderId ?? '');
  if (!orderId) throw new HttpError(400, 'ORDER_ID_REQUIRED');
  try {
    await vaultApi.captureFunding(vault.id, orderId);
  } finally {
    balanceChanged(account);
  }
  startAgent(vault.id);
  res.json(await ownVault(account, vault.id));
});

// Ask a friend: a PayPal money request to their PayPal email (no money leaves the customer's PayPal).
app.post('/me/vaults/:id/fund/friend', async (req, res) => {
  const account = loggedIn(req);
  const vault = await unfundedVault(account, req.params.id);
  if (String(req.body?.friendEmail ?? '').trim().toLowerCase() === account.sandboxEmail.toLowerCase()) {
    throw new HttpError(400, 'CANNOT_ASK_YOURSELF', { message: 'That is your own PayPal. Pick "Pay with PayPal" instead.' });
  }
  const request = await askFriend(account, vault.id, req.body?.friendEmail, req.body?.message);
  res.status(201).json({ ...(await ownVault(account, vault.id)), request });
});

app.post('/me/vaults/:id/fund/requests/sync', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  await vaultApi.syncFundRequests(vault.id);
  const after = await ownVault(loggedIn(req), req.params.id);
  if (vault.status === 'PENDING_FUNDING' && after.status === 'ACTIVE') startAgent(vault.id); // the friend paid
  res.json(after);
});

app.post('/me/vaults/:id/fund/requests/:requestId/cancel', async (req, res) => {
  const account = loggedIn(req);
  const vault = await ownVault(account, req.params.id);
  await vaultApi.cancelFundRequest(vault.id, req.params.requestId);
  res.json(await ownVault(account, vault.id));
});

// ---- Money requests sent TO this customer (a friend asked them to fund a vault) ----

app.get('/me/requests', async (req, res) => {
  const account = loggedIn(req);
  res.json(await vaultApi.listFundRequests(account.sandboxEmail, 'OPEN'));
});

// "I paid it": ask PayPal now instead of waiting for the webhook or the next background check.
app.post('/me/requests/:id/check', async (req, res) => {
  const account = loggedIn(req);
  const mine: { id: string; vaultId: string }[] = await vaultApi.listFundRequests(account.sandboxEmail);
  const request = mine.find((r) => r.id === req.params.id);
  if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND');
  const result = await vaultApi.syncFundRequest(request.id);
  if (result?.status === 'PAID') {
    startAgent(request.vaultId);
    balanceChanged(account);
  }
  res.json(result);
});

// ---- Change a vault's policy (what it is for, and its amount) ----

// Step 1: new amount + description -> AI writes the new rules. Says how much money would move.
app.post('/me/vaults/:id/policy/preview', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active envelope can be changed.' });
  const draft = await draftPolicy(req.body?.amount, req.body?.description, req.body?.control);
  draft.policy.savings = vault.policy.savings; // a payment plan cannot be changed (PayPalVault keeps it too)
  const check = await vaultApi.changePolicy(vault.id, { policy: draft.policy, sourceText: draft.sourceText, dryRun: true });
  res.json({ ...draft, ...check });
});

// Step 2: password confirmed -> pay the extra amount (or refund the difference) and save the new rules.
app.post('/me/vaults/:id/policy', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  const change = { policy: req.body?.policy, sourceText: req.body?.sourceText };
  const { changeCents } = await vaultApi.changePolicy(vault.id, { ...change, dryRun: true });

  if (changeCents > 0) {
    // A higher amount: take the difference from the saved PayPal account, like the first payment.
    const link = await linkFor(account, req);
    await checkBalance(account, changeCents);
    const nextVersion = (vault.policyHistory?.[0]?.version ?? 1) + 1;
    try {
      await payIntoVault(vault, changeCents, link, `fund-topup-${vault.id}-v${nextVersion}-${changeCents}`);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(402, 'PAYMENT_FAILED', { message: err instanceof PayPalApiError ? err.body?.message ?? err.message : (err as Error).message });
    } finally {
      balanceChanged(account);
    }
  }

  const saved = await vaultApi.changePolicy(vault.id, change);
  if (changeCents < 0) balanceChanged(account); // the difference is on its way back
  startAgent(vault.id); // look again right away, with the new rules
  res.json({ ...saved, vault: await ownVault(account, vault.id) });
});

app.post('/me/vaults/:id/agent', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active envelope can run its agent.' });
  startAgent(vault.id);
  res.status(202).json({ started: true });
});

app.post('/me/vaults/:id/agent/stop', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await vaultApi.stopAgent(vault.id));
});

app.post('/me/vaults/:id/liquidate', async (req, res) => {
  const account = loggedIn(req);
  const vault = await ownVault(account, req.params.id);
  res.json(await vaultApi.liquidate(vault.id));
  balanceChanged(account); // the refund lands in the sandbox account
});

// A purchase the agent could not make alone. Approving spends money, so it needs the password.
app.post('/me/vaults/:id/decisions/:decisionId/approve', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  res.json(await vaultApi.approvePurchase(vault.id, req.params.decisionId));
});

app.post('/me/vaults/:id/decisions/:decisionId/reject', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await vaultApi.rejectPurchase(vault.id, req.params.decisionId));
});

// ---- Paying in over time (savings) ----

// Take the next payment now, instead of waiting for its date. Moves money, so it needs the password.
app.post('/me/vaults/:id/savings/pay-now', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  try {
    const result = await vaultApi.chargeSavingsNow(vault.id);
    if (result.status === 'ACTIVE' && vault.type !== 'SAVINGS') startAgent(vault.id); // goal reached: shop now
    res.json(result);
  } finally {
    balanceChanged(account);
  }
});

// Vault calendar drags. Both change when money moves or how long it stays locked, so they need the password.
app.post('/me/vaults/:id/savings/next', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  res.json(await vaultApi.moveSavingsPayment(vault.id, req.body?.at));
});

app.post('/me/vaults/:id/expiry', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  res.json(await vaultApi.changeExpiry(vault.id, req.body?.expiresAt));
});

// Vault timeline drag: when the agent looks again (moves no money, so no password).
app.post('/me/vaults/:id/agent/next', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await vaultApi.scheduleAgent(vault.id, req.body?.at));
});

for (const action of ['pause', 'resume']) {
  app.post(`/me/vaults/:id/savings/${action}`, async (req, res) => {
    const vault = await ownVault(loggedIn(req), req.params.id);
    res.json(await (action === 'pause' ? vaultApi.pauseSavings(vault.id) : vaultApi.resumeSavings(vault.id)));
  });
}

// ---- Control setting: Ask me / Ask above $X / Autopilot ----

// Switch how much the AI may do alone. Saved as the next rules version (same rules otherwise).
app.post('/me/vaults/:id/control', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active envelope can be changed.' });
  if (!CONTROL_MODES.includes(req.body?.control?.mode)) throw new HttpError(400, 'INVALID_CONTROL', { message: 'Pick Ask me, Ask above an amount, or Autopilot.' });
  const policy = structuredClone(vault.policy);
  setControl(policy, req.body.control);
  const saved = await vaultApi.changePolicy(vault.id, { policy, sourceText: vault.policyHistory?.[0]?.sourceText ?? undefined });
  startAgent(vault.id); // e.g. switched from Ask me to Autopilot: the agent may buy now
  res.json({ ...saved, vault: await ownVault(account, vault.id) });
});

// Ask me: the customer picks one of the agent's options. Picking spends money, so it needs the password.
app.post('/me/vaults/:id/proposals/:proposalId/choose', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  const result = await vaultApi.chooseOption(vault.id, req.params.proposalId, Number(req.body?.index))
    .catch((err) => {
      // Blocked by the vault rules: say why (the options stay open, so another one can be picked).
      if (err instanceof PayPalVaultError && err.body?.decision) {
        throw new HttpError(403, 'BLOCKED', { message: 'PayPalVault blocked this option', reasons: (err.body.decision as { reasons: string[] }).reasons });
      }
      throw err;
    });
  if (result.decision?.result === 'APPROVE') balanceChanged(account);
  res.json(result);
});

app.post('/me/vaults/:id/proposals/:proposalId/reject', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await vaultApi.rejectOptions(vault.id, req.params.proposalId));
  startAgent(vault.id); // look again now, skipping these products
});

// ---------- Answer from email: Approve / Reject / Pick (two-way alert emails) ----------
// The buttons in an alert email open these pages. Opening a link never acts on its own (mail apps
// and virus scanners open links by themselves): the page shows what will happen and the owner
// presses the button. Approve and Pick move money, so they also need the vault owner's password.

const escHtml = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (dollars: number) => `$${Number(dollars).toFixed(2)}`;

type ActionContext = {
  vault: any;
  owner: Account | undefined;
  open: boolean; // still waiting for an answer
  heading: string;
  rows: [string, string][];
  button: string;
  needsPassword: boolean;
};

async function actionContext(action: ApprovalAction): Promise<ActionContext | null> {
  const vault = await vaultApi.getVault(action.v).catch(() => null);
  if (!vault) return null;
  const owner = Object.values(ACCOUNTS).find((a) => a.sandboxEmail.toLowerCase() === String(vault.user?.paypalEmail ?? '').toLowerCase());
  const vaultRow: [string, string] = ['Vault', `${vault.name} · ${money(vault.balanceCents / 100)} left`];

  if (action.a === 'approve' || action.a === 'reject') {
    const d = (vault.decisions ?? []).find((x: any) => x.id === action.d);
    if (!d) return null;
    const r = d.requestJson ?? {};
    return {
      vault,
      owner,
      open: vault.status === 'ACTIVE' && d.result === 'NEEDS_HUMAN' && !d.resolvedBy,
      heading: action.a === 'approve' ? `Approve ${money(r.amount ?? 0)} at ${r.merchant}?` : `Reject ${money(r.amount ?? 0)} at ${r.merchant}?`,
      rows: [['Item', r.reason ?? 'a purchase'], ['Shop', r.merchant ?? '?'], ['Price', money(r.amount ?? 0)], vaultRow],
      button: action.a === 'approve' ? `Approve & pay ${money(r.amount ?? 0)}` : 'Reject',
      needsPassword: action.a === 'approve',
    };
  }

  if (action.a !== 'pick' && action.a !== 'none') return null;
  const proposalId = action.p;
  const p = (vault.proposals ?? []).find((x: any) => x.id === proposalId);
  if (!p) return null;
  const open = vault.status === 'ACTIVE' && p.status === 'OPEN';
  if (action.a === 'none') {
    return {
      vault, owner, open,
      heading: 'None of these options?',
      rows: [...(p.options ?? []).map((o: any, i: number) => [`Option ${i + 1}`, `${o.title} · ${money(o.verified_price ?? o.price)} at ${o.merchant}`] as [string, string]), vaultRow],
      button: 'None of these: look again',
      needsPassword: false,
    };
  }
  if (action.a !== 'pick') return null;
  const index = action.i;
  const o = p.options?.[index];
  if (!o) return null;
  return {
    vault, owner, open,
    heading: `Buy option ${index + 1} for ${money(o.verified_price ?? o.price)}?`,
    rows: [['Item', o.title], ['Shop', o.merchant], ['Price', money(o.verified_price ?? o.price)], vaultRow],
    button: `Pick & pay ${money(o.verified_price ?? o.price)}`,
    needsPassword: true,
  };
}

function actionPage(res: Response, status: number, page: { title: string; text?: string; rows?: [string, string][]; form?: { token: string; button: string; needsPassword: boolean; error?: string }; tone?: 'good' | 'bad' | 'warn'; vaultId?: string }) {
  const color = { good: '#007934', bad: '#D9381E', warn: '#B7791F' }[page.tone ?? 'warn'];
  const rows = (page.rows ?? []).map(([k, v]) => `<tr><td class="k">${escHtml(k)}</td><td>${escHtml(v)}</td></tr>`).join('');
  const form = page.form ? `
    <form method="post" action="/email/act">
      <input type="hidden" name="t" value="${escHtml(page.form.token)}">
      ${page.form.needsPassword ? `<label for="pw">Confirm with your password</label>
      <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>` : ''}
      ${page.form.error ? `<p class="err" role="alert">${escHtml(page.form.error)}</p>` : ''}
      <button type="submit">${escHtml(page.form.button)}</button>
    </form>` : '';
  res.status(status).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>PayPalVault · ${escHtml(page.title)}</title>
<style>
  body{margin:0;background:#F5F7FA;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0C0C0D}
  .card{max-width:440px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
  .top{background:#003087;color:#fff;padding:16px 22px;font-weight:700}
  .in{padding:22px}
  h1{font-size:19px;margin:0 0 12px;color:${color}}
  p{line-height:1.5;margin:0 0 14px;font-size:15px}
  table{font-size:14px;margin-bottom:16px;border-collapse:collapse}
  td{padding:5px 0;vertical-align:top} td.k{color:#6C7378;padding-right:16px;white-space:nowrap}
  label{display:block;font-size:14px;margin-bottom:6px;color:#444749}
  input[type=password]{width:100%;box-sizing:border-box;padding:12px;border:1px solid #CBD2D6;border-radius:8px;font-size:15px;margin-bottom:12px}
  button{width:100%;background:#0070BA;color:#fff;border:0;border-radius:24px;padding:13px;font-size:15px;font-weight:600;cursor:pointer}
  .err{color:#D9381E;font-size:14px}
  a{color:#0070BA}
  @media (max-width:480px){.card{margin:16px}}
</style></head><body><div class="card"><div class="top">PayPalVault</div><div class="in">
  <h1>${escHtml(page.title)}</h1>
  ${page.text ? `<p>${escHtml(page.text)}</p>` : ''}
  ${rows ? `<table>${rows}</table>` : ''}
  ${form}
  ${page.vaultId ? `<p style="margin-top:16px;font-size:14px"><a href="/?vault=${encodeURIComponent(page.vaultId)}">Open the vault</a></p>` : ''}
</div></div></body></html>`);
}

const linkProblem = (reason: 'INVALID' | 'EXPIRED') => reason === 'EXPIRED'
  ? { title: 'This link has expired', text: 'Email buttons work for 24 hours. Open the vault on the site to answer.' }
  : { title: 'This link does not work', text: 'Open the vault on the site to answer.' };

app.get('/email/act', async (req, res) => {
  const token = String(req.query.t ?? '');
  const checked = verifyApprovalLink(token, SECRET);
  if (!checked.ok) return actionPage(res, 400, { ...linkProblem(checked.reason), tone: 'bad' });
  const ctx = await actionContext(checked.action);
  if (!ctx) return actionPage(res, 404, { ...linkProblem('INVALID'), tone: 'bad' });
  if (!ctx.open) return actionPage(res, 409, { title: 'Already answered', text: 'This was already handled (or the vault is no longer active). Nothing more to do.', vaultId: ctx.vault.id, tone: 'good' });
  actionPage(res, 200, {
    title: ctx.heading,
    rows: ctx.rows,
    text: ctx.needsPassword ? 'PayPalVault checks the vault rules again before paying.' : 'No money moves. The AI looks for something else.',
    form: { token, button: ctx.button, needsPassword: ctx.needsPassword },
    vaultId: ctx.vault.id,
  });
});

app.post('/email/act', express.urlencoded({ extended: false, limit: '8kb' }), async (req, res) => {
  const token = String(req.body?.t ?? '');
  const checked = verifyApprovalLink(token, SECRET);
  if (!checked.ok) return actionPage(res, 400, { ...linkProblem(checked.reason), tone: 'bad' });
  const action = checked.action;
  const ctx = await actionContext(action);
  if (!ctx) return actionPage(res, 404, { ...linkProblem('INVALID'), tone: 'bad' });
  if (!ctx.open) return actionPage(res, 409, { title: 'Already answered', text: 'This was already handled (or the vault is no longer active). Nothing more to do.', vaultId: ctx.vault.id, tone: 'good' });
  const again = (error: string, status = 400) => actionPage(res, status, {
    title: ctx.heading, rows: ctx.rows, form: { token, button: ctx.button, needsPassword: ctx.needsPassword, error }, vaultId: ctx.vault.id,
  });
  if (ctx.needsPassword && !(ctx.owner && (passwordOk(ctx.owner, req.body?.password) || recipientPasswordOk(ctx.owner, req.body?.password, (await prisma.vault.findUnique({ where: { id: ctx.vault.id }, select: { alertEmail: true } }))?.alertEmail)))) return again('Wrong password.', 401);

  const done = (title: string, text: string, tone: 'good' | 'warn' | 'bad' = 'good') => actionPage(res, 200, { title, text, vaultId: ctx.vault.id, tone });
  try {
    if (action.a === 'approve') {
      await vaultApi.approvePurchase(ctx.vault.id, action.d);
      if (ctx.owner) balanceChanged(ctx.owner);
      return done('Approved', 'PayPalVault is paying the shop now. You will get an email when it is done.');
    }
    if (action.a === 'reject') {
      await vaultApi.rejectPurchase(ctx.vault.id, action.d);
      return done('Rejected', 'Nothing was paid. The AI will look for something else.');
    }
    if (action.a === 'none') {
      await vaultApi.rejectOptions(ctx.vault.id, action.p);
      startAgent(ctx.vault.id); // look again now, skipping these products
      return done('Got it', 'Nothing was paid. The AI is looking for other options and will email you.');
    }
    if (action.a !== 'pick') throw new Error(`Unknown email action ${action.a}`);
    const result = await vaultApi.chooseOption(ctx.vault.id, action.p, action.i);
    if (result.decision?.result === 'NEEDS_HUMAN') {
      return done('One more check', 'Your pick needs one more approval under the vault rules. Look for the approval email, or open the vault.', 'warn');
    }
    if (ctx.owner) balanceChanged(ctx.owner);
    return done('Done', 'PayPalVault is paying the shop for your pick. You will get an email when it is done.');
  } catch (err) {
    const body = err instanceof PayPalVaultError ? err.body : {};
    const reasons = (body.reasons ?? (body.decision as { reasons?: string[] } | undefined)?.reasons) as string[] | undefined;
    if (body.error === 'DECISION_NOT_PENDING' || body.error === 'PROPOSAL_NOT_OPEN') {
      return done('Already answered', 'This was already handled. Nothing more to do.');
    }
    if (reasons?.length) {
      return done('Blocked by your vault rules', `PayPalVault did not pay: ${reasons.join(', ').toLowerCase().replace(/_/g, ' ')}. Nothing was charged.`, 'bad');
    }
    console.error('Email action failed:', (err as Error).message);
    return done('Something went wrong', 'Nothing was charged. Open the vault to try again.', 'bad');
  }
});

// ---------- Business dashboard (seller side): read-only ----------

app.get('/biz/me', async (req, res) => {
  const biz = loggedInBusiness(req);
  const shops = await business.storefronts(biz);
  res.json({ name: biz.name, personName: businessPersonName(req), username: biz.username, sandboxEmail: biz.sandboxEmail, storefronts: shops.map((s) => s.name) });
});

// Live balance of the business's PayPal sandbox account (read from sandbox.paypal.com).
app.get('/biz/balance', async (req, res) => {
  res.json(await businessBalance(loggedInBusiness(req), { force: req.query.fresh === '1' }));
});

// Every transaction on the business's PayPal account, with AI-agent payments recognised (agent buyers anonymous).
app.get('/biz/transactions', async (req, res) => {
  res.json(await business.transactions(loggedInBusiness(req)));
});

// The business's own bookkeeping on a transaction (Reconciled / Tag / Note), edited in the grid.
app.post('/biz/notes', async (req, res) => {
  const biz = loggedInBusiness(req);
  const { id, field, value } = req.body ?? {};
  try {
    res.json(await saveNote(biz, String(id ?? ''), String(field ?? ''), value));
  } catch (err) {
    res.status(400).json({ error: 'BAD_NOTE', message: (err as Error).message });
  }
});

// "Sync now": read new transactions from PayPal right away.
app.post('/biz/sync', async (req, res) => {
  const biz = loggedInBusiness(req);
  await syncTransactions(biz, { force: true });
  res.json(await transactionsConnection(biz));
});

// Payments-only change signal: the page polls this instead of the platform's live socket (which carries
// every customer's vault events). A business only ever learns that its own payments changed.
app.get('/biz/pulse', async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await business.pulse(loggedInBusiness(req)));
});

// Bought together: product pairs, counts only (a pair shows once enough different buyers paid for both).
app.get('/biz/together', async (req, res) => {
  res.json(await business.together(loggedInBusiness(req)));
});

app.post('/biz/ask', async (req, res) => {
  loggedInBusiness(req);
  const text = String(req.body?.text ?? '').trim().slice(0, 300);
  if (!text) throw new HttpError(400, 'EMPTY_REQUEST');
  try {
    res.json(await business.ask('orders', text));
  } catch (err) {
    res.status(503).json({ error: 'AI_UNAVAILABLE', message: (err as Error).message });
  }
});

// ---------- Static site ----------

// Only the site's own files are public (not this server, accounts.ts or data/).
const dir = fileURLToPath(new URL('.', import.meta.url));
for (const file of ['index.html', 'styles.css', 'app.js', 'business.html', 'business.css', 'business.js']) {
  const urls = file === 'index.html' ? ['/', '/index.html'] : file === 'business.html' ? ['/business', '/business.html'] : [`/${file}`];
  app.get(urls, (_req, res) => res.sendFile(file, { root: dir }));
}

// AG Grid Community + AG Charts Community (MIT, no licence key): their ready-made browser bundles,
// served straight from node_modules. Only the business page loads them.
const nodeRequire = createRequire(import.meta.url);
const distOf = (pkg: string) => path.join(path.dirname(nodeRequire.resolve(pkg)), '..');
app.get('/vendor/ag-grid.js', (_req, res) => res.sendFile('ag-grid-community.min.js', { root: distOf('ag-grid-community') }));
app.get('/vendor/ag-charts.js', (_req, res) => res.sendFile('umd/ag-charts-community.min.js', { root: distOf('ag-charts-community') }));
// Business page only: AG Grid Enterprise + AG Charts Enterprise (Integrated Charts, sparklines, Excel
// export). The personal pages keep the Community bundles above. Load order matters: charts first, so the
// grid's UMD bundle finds window.agCharts and registers Integrated Charts with it.
app.get('/vendor/ag-charts-enterprise.js', (_req, res) => res.sendFile('umd/ag-charts-enterprise.min.js', { root: distOf('ag-charts-enterprise') }));
app.get('/vendor/ag-grid-enterprise.js', (_req, res) => res.sendFile('ag-grid-enterprise.min.js', { root: distOf('ag-grid-enterprise') }));
// AG Grid Enterprise licence from .env (AG_GRID_LICENSE_KEY). Without one the Enterprise features still
// work, with AG Grid's trial watermark. Like the Bryntum key, it reaches the browser by design.
app.get('/biz/ag-license.js', (_req, res) => {
  res.type('application/javascript').set('Cache-Control', 'no-store');
  res.send(`window.AG_GRID_LICENSE_KEY = ${JSON.stringify(process.env.AG_GRID_LICENSE_KEY?.trim() ?? '')};`);
});
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Bryntum Enterprise (Calendar, Scheduler, Gantt, TaskBoard sharing one core), bundled by
// scripts/build-bryntum.mjs. Built on start when missing or outdated; the page loads it only when a view opens.
await ensureBryntum();
if (!process.env.BRYNTUM_LICENSE_KEY?.trim()) console.warn('BRYNTUM_LICENSE_KEY is not set in .env: Bryntum views run in trial mode.');
// The license key, registered before the bundle loads. It ends up in the browser anyway (that is how
// Bryntum licensing works); keeping it in .env just keeps it out of git.
app.get('/bryntum-license.js', (_req, res) => {
  res.type('application/javascript').set('Cache-Control', 'no-store');
  res.send(`(window.bryntum ??= {}).licenseKey = ${JSON.stringify(process.env.BRYNTUM_LICENSE_KEY?.trim() ?? '')};`);
});
app.use('/vendor', express.static(BRYNTUM_OUT, { index: false }));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, ...err.extra });
  if (err instanceof PayPalVaultError) return res.status(err.status).json(err.body);
  if (err instanceof PayPalApiError) return res.status(502).json({ error: 'PAYPAL_ERROR', message: err.body?.message ?? err.message });
  console.error(err);
  res.status(502).json({ error: 'BACKEND_UNAVAILABLE', message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`PayPal demo site on http://localhost:${PORT} (PayPalVault API: ${PAYPALVAULT_API})`);
});
server.on('upgrade', proxyUpgrade); // live updates over WebSocket
