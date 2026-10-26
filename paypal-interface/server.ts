// PayPal-style customer site (the front end) on top of the KubePay API (the back end).
//   npx tsx paypal-interface/server.ts   ->  http://localhost:3000
// It serves the static site, logs customers in, links their PayPal sandbox account, and drives the
// KubePay API for everything vault related (create, fund, agent, approvals, refunds).
// Each customer maps to a KubePay user (by PayPal sandbox email), so they only see their own vaults.

import { createHmac, timingSafeEqual } from 'node:crypto';
import http, { type IncomingMessage } from 'node:http';
import https from 'node:https';
import type { Duplex } from 'node:stream';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { completeFunding, failFunding, prisma, startFunding } from '@kubepay/db'; // also loads the repo-root .env
import { PayPalApiError } from '@kubepay/paypal';
import { ACCOUNTS, type Account } from './accounts.ts';
import { autoLink, chargeSavedPayPal, finishLink, getLink, LinkError, startLink, unlink, type PayPalLink } from './paypal-link.ts';
import { balanceChanged, sandboxBalance } from './sandbox-balance.ts';

const PORT = Number(process.env.INTERFACE_PORT ?? 3000);
const KUBEPAY_API = (process.env.KUBEPAY_API_URL?.trim() || `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, '');
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
  return ACCOUNTS[username] ?? null;
}

function setCookie(req: Request, res: Response, value: string, maxAgeMs: number) {
  const secure = req.secure ? '; Secure' : ''; // https when opened through the Cloudflare tunnel
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}

function passwordOk(account: Account, password: unknown) {
  const given = Buffer.from(String(password ?? ''));
  const expected = Buffer.from(account.password);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function loggedIn(req: Request): Account {
  const account = readSession(req);
  if (!account) throw new HttpError(401, 'NOT_LOGGED_IN');
  return account;
}

// ---------- Customer <-> KubePay user, balance ----------

/** The KubePay user row for this customer. Created on first login, matched by sandbox email. */
async function kubepayUser(account: Account) {
  return prisma.user.upsert({
    where: { paypalEmail: account.sandboxEmail },
    update: {},
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
  const user = await kubepayUser(account);
  const link = await getLink(account.username);
  return {
    username: account.username,
    name: account.name,
    sandboxEmail: account.sandboxEmail,
    userId: user.id,
    paypalLinked: link ? { email: link.email, linkedAt: link.linkedAt } : null,
    paypalLinking: !link && linking.has(account.username),
    paypalLinkError: link ? null : linkErrors.get(account.username) ?? null,
  };
}

// ---------- KubePay API ----------

class KubePayError extends Error {
  constructor(public status: number, public body: Record<string, unknown>) {
    super(String(body.message ?? body.error ?? `KubePay API answered ${status}`));
  }
}

async function kubepay<T = any>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${KUBEPAY_API}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new KubePayError(res.status, data);
  return data as T;
}

/** The vault, if it belongs to this customer. */
async function ownVault(account: Account, vaultId: string) {
  const { userId } = await profile(account);
  const vault = await kubepay('GET', `/api/vaults/${encodeURIComponent(vaultId)}`).catch((err) => {
    if (err instanceof KubePayError && err.status === 404) throw new HttpError(404, 'VAULT_NOT_FOUND');
    throw err;
  });
  if (vault.userId !== userId) throw new HttpError(404, 'VAULT_NOT_FOUND');
  return vault;
}

/** Starts the vault's AI agent in the background; its steps stream to the browser over Socket.IO. */
function startAgent(vaultId: string) {
  kubepay('POST', `/api/vaults/${vaultId}/agent`, {}).catch((err) => {
    if (!(err instanceof KubePayError && err.body.error === 'AGENT_ALREADY_RUNNING')) {
      console.error(`Agent for vault ${vaultId} failed:`, (err as Error).message);
    }
  });
}

/**
 * Pays `amountCents` into the vault from the customer's saved PayPal account and credits it through
 * the KubePay ledger, the same entries the PayPal button flow writes (FUND, then COMPLETED + ACTIVE).
 * Used for the first payment and for top-ups after a policy change (each with its own `requestId`,
 * so a retry returns the same PayPal order instead of paying twice).
 */
async function payIntoVault(vault: { id: string; name: string }, amountCents: number, link: PayPalLink, requestId?: string) {
  const order = await chargeSavedPayPal({
    paymentTokenId: link.paymentTokenId,
    vaultId: vault.id,
    amountCents,
    description: `Fund KubePay vault: ${vault.name}`,
    requestId,
  });
  const known = await prisma.ledgerEntry.findUnique({ where: { paypalRef: order.orderId } });
  if (!known) await startFunding(vault.id, amountCents, order.orderId);

  if (order.status === 'COMPLETED') {
    // Paid in one step (saved account): credit the vault like the capture route does.
    if (order.captureStatus === 'COMPLETED') await completeFunding(order.orderId);
    else if (order.captureStatus === 'DECLINED' || order.captureStatus === 'FAILED') {
      await failFunding(order.orderId, `capture ${order.captureStatus}`);
      throw new HttpError(402, 'PAYMENT_DECLINED', { message: 'PayPal declined the payment.' });
    } else {
      throw new HttpError(202, 'PAYMENT_PENDING', { message: `PayPal is still processing the payment (${order.captureStatus}).` });
    }
  } else {
    // Order approved by the saved account but not captured yet: let KubePay capture and credit it.
    await kubepay('POST', `/api/vaults/${vault.id}/fund/capture`, { orderId: order.orderId });
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
  if (balance.status === 'OK' && amountCents > balance.cents) {
    throw new HttpError(402, 'INSUFFICIENT_FUNDS', { message: 'Not enough money in your PayPal balance.' });
  }
}

/** Amount + description -> policy written by the KubePay AI. The amount the customer typed is the budget. */
async function draftPolicy(amountInput: unknown, descriptionInput: unknown) {
  const amount = Math.round(Number(amountInput) * 100) / 100;
  const description = String(descriptionInput ?? '').trim();
  if (!(amount >= 1) || amount > 10_000) throw new HttpError(400, 'INVALID_AMOUNT', { message: 'Enter an amount between $1 and $10,000.' });
  if (description.length < 5) throw new HttpError(400, 'DESCRIPTION_TOO_SHORT', { message: 'Describe what the vault is for.' });

  const text = `${description}. Vault budget: $${amount.toFixed(2)}.`;
  const draft = await kubepay('POST', '/api/vaults/compile', { text });
  // No limit may exceed the amount.
  const rules = draft.policy.rules;
  draft.policy.allocated_budget = amount;
  rules.max_single_transaction = Math.min(rules.max_single_transaction, amount);
  if (rules.human_approval_above !== undefined && rules.human_approval_above >= amount) delete rules.human_approval_above;
  return { ...draft, sourceText: text };
}

// ---------- Pass-through to the KubePay API ----------
// This site is the only public URL (e.g. the Cloudflare tunnel). The browser's live updates
// (/socket.io, incl. the WebSocket upgrade) and PayPal's webhooks (/webhooks) reach the API through it.

const PROXIED = ['/socket.io/', '/webhooks/'];
const isProxied = (url = '') => PROXIED.some((prefix) => url.startsWith(prefix));

function apiRequest(req: IncomingMessage) {
  const target = new URL(req.url ?? '/', KUBEPAY_API);
  return (target.protocol === 'https:' ? https : http).request(target, {
    method: req.method,
    headers: { ...req.headers, host: target.host },
  });
}

function proxyToApi(req: Request, res: Response) {
  req.url = req.originalUrl; // Express strips the mount path
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
  if (!isProxied(req.url)) return socket.destroy();
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
  const api = await fetch(`${KUBEPAY_API}/health`).then((r) => r.ok).catch(() => false);
  res.status(api ? 200 : 503).json({ ok: api, site: true, api });
});

app.post('/auth/login', async (req, res) => {
  // Like PayPal: log in with the sandbox email, or with the short username.
  const login = String(req.body?.username ?? '').trim().toLowerCase();
  const account = ACCOUNTS[login] ?? Object.values(ACCOUNTS).find((a) => a.sandboxEmail.toLowerCase() === login);
  if (!account || !passwordOk(account, req.body?.password)) {
    return res.status(401).json({ error: 'INVALID_LOGIN', message: 'Wrong email/username or password.' });
  }
  await startLinkingIfNeeded(account, req, true);
  const me = await profile(account);
  setCookie(req, res, sessionCookie(account.username), SESSION_MS);
  res.json(me);
});

app.post('/auth/logout', (req, res) => {
  setCookie(req, res, '', 0);
  res.json({ ok: true });
});

app.get('/auth/me', async (req, res) => {
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

// The logged-in customer's vaults, straight from the KubePay API.
app.get('/me/vaults', async (req, res) => {
  const { userId } = await profile(loggedIn(req));
  const vaults: { userId: string }[] = await kubepay('GET', '/api/vaults');
  res.json(vaults.filter((v) => v.userId === userId));
});

// Step 1: amount + description -> AI writes the policy (KubePay compiler). Nothing is saved.
app.post('/me/vaults/preview', async (req, res) => {
  loggedIn(req);
  res.json(await draftPolicy(req.body?.amount, req.body?.description));
});

// Step 2: password confirmed -> create the vault, pay it from the saved PayPal account, start the AI.
app.post('/me/vaults', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const link = await linkFor(account, req);
  const { userId } = await profile(account);
  await checkBalance(account, Math.round(Number(req.body?.policy?.allocated_budget) * 100));

  const vault = await kubepay('POST', '/api/vaults', { policy: req.body.policy, sourceText: req.body.sourceText, userId });
  try {
    await payIntoVault(vault, vault.budgetCents, link);
    startAgent(vault.id); // the AI takes over right away (watch mode keeps shopping vaults looking)
  } catch (err) {
    // The vault stays "awaiting funding"; KubePay's sweeper closes it when it expires.
    if (err instanceof HttpError) throw Object.assign(err, { extra: { ...err.extra, vaultId: vault.id } });
    const message = err instanceof PayPalApiError ? err.body?.message ?? err.message : (err as Error).message;
    throw new HttpError(402, 'PAYMENT_FAILED', { message, vaultId: vault.id });
  } finally {
    balanceChanged(account);
  }
  res.status(201).json(await ownVault(account, vault.id));
});

app.get('/me/vaults/:id', async (req, res) => {
  res.json(await ownVault(loggedIn(req), req.params.id));
});

// ---- Change a vault's policy (what it is for, and its amount) ----

// Step 1: new amount + description -> AI writes the new rules. Says how much money would move.
app.post('/me/vaults/:id/policy/preview', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active vault can be changed.' });
  const draft = await draftPolicy(req.body?.amount, req.body?.description);
  const check = await kubepay('POST', `/api/vaults/${vault.id}/policy`, { policy: draft.policy, sourceText: draft.sourceText, dryRun: true });
  res.json({ ...draft, ...check });
});

// Step 2: password confirmed -> pay the extra amount (or refund the difference) and save the new rules.
app.post('/me/vaults/:id/policy', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  const change = { policy: req.body?.policy, sourceText: req.body?.sourceText };
  const { changeCents } = await kubepay('POST', `/api/vaults/${vault.id}/policy`, { ...change, dryRun: true });

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

  const saved = await kubepay('POST', `/api/vaults/${vault.id}/policy`, change);
  if (changeCents < 0) balanceChanged(account); // the difference is on its way back
  startAgent(vault.id); // look again right away, with the new rules
  res.json({ ...saved, vault: await ownVault(account, vault.id) });
});

app.post('/me/vaults/:id/agent', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active vault can run its agent.' });
  startAgent(vault.id);
  res.status(202).json({ started: true });
});

app.post('/me/vaults/:id/agent/stop', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await kubepay('POST', `/api/vaults/${vault.id}/agent/stop`, {}));
});

app.post('/me/vaults/:id/liquidate', async (req, res) => {
  const account = loggedIn(req);
  const vault = await ownVault(account, req.params.id);
  res.json(await kubepay('POST', `/api/vaults/${vault.id}/liquidate`, {}));
  balanceChanged(account); // the refund lands in the sandbox account
});

// A purchase the agent could not make alone. Approving spends money, so it needs the password.
app.post('/me/vaults/:id/decisions/:decisionId/approve', async (req, res) => {
  const account = loggedIn(req);
  if (!passwordOk(account, req.body?.password)) throw new HttpError(401, 'WRONG_PASSWORD', { message: 'Wrong password.' });
  const vault = await ownVault(account, req.params.id);
  res.json(await kubepay('POST', `/api/vaults/${vault.id}/decisions/${encodeURIComponent(req.params.decisionId)}/approve`, {}));
});

app.post('/me/vaults/:id/decisions/:decisionId/reject', async (req, res) => {
  const vault = await ownVault(loggedIn(req), req.params.id);
  res.json(await kubepay('POST', `/api/vaults/${vault.id}/decisions/${encodeURIComponent(req.params.decisionId)}/reject`, {}));
});

// ---------- Static site ----------

// Only the site's own files are public (not this server, accounts.ts or data/).
const dir = fileURLToPath(new URL('.', import.meta.url));
for (const file of ['index.html', 'styles.css', 'app.js']) {
  app.get(file === 'index.html' ? ['/', '/index.html'] : `/${file}`, (_req, res) => res.sendFile(file, { root: dir }));
}
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, ...err.extra });
  if (err instanceof KubePayError) return res.status(err.status).json(err.body);
  if (err instanceof PayPalApiError) return res.status(502).json({ error: 'PAYPAL_ERROR', message: err.body?.message ?? err.message });
  console.error(err);
  res.status(502).json({ error: 'BACKEND_UNAVAILABLE', message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`PayPal demo site on http://localhost:${PORT} (KubePay API: ${KUBEPAY_API})`);
});
server.on('upgrade', proxyUpgrade); // live updates over WebSocket
