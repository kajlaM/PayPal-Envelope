// Every PayPal transaction of a business account, read from PayPal itself (not only AI-agent payments):
// sales, invoices, payouts received, refunds, fees, withdrawals... exactly what the business sees in PayPal.
//
//   1. REST Transaction Search (/v1/reporting/transactions) with the business's own REST app
//      (<PREFIX>_CLIENT_ID / _CLIENT_SECRET, "Transaction search" turned on in the app's features).
//   2. Fallback: the classic NVP TransactionSearch with the business's API credentials
//      (<PREFIX>_API_USERNAME / _API_PASSWORD / _API_SIGNATURE), plus GetTransactionDetails for item names.
//
// Read-only: nothing here moves money or talks to any customer or agent. Transactions are cached per
// business in data/ (gitignored) and re-synced in the background, so the dashboard never waits on PayPal.
// PayPal's report can lag a few hours behind; the last days are re-read on every sync.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { BusinessAccount } from './accounts.ts';

const BASE = process.env.PAYPAL_BASE_URL?.trim() || 'https://api-m.sandbox.paypal.com';
const NVP = process.env.PAYPAL_NVP_URL?.trim() || 'https://api-3t.sandbox.paypal.com/nvp';
const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));
const DAY_MS = 86_400_000;
const HISTORY_DAYS = 180; // first sync reads this far back
const CHUNK_DAYS = 31; // PayPal allows at most 31 days per search
const OVERLAP_MS = 3 * DAY_MS; // re-read the last days: late arrivals and status changes
const SYNC_EVERY_MS = 2 * 60_000;
const DETAILS_PER_SYNC = 40; // NVP only: item names for this many new sales per sync
const DETAILS_MAX_TRIES = 3; // NVP only: a sale whose details keep failing is given up after this many syncs

export type Kind = 'sale' | 'refund' | 'fee' | 'transfer' | 'other' | 'none';
export type PayPalTxn = {
  id: string;
  at: string;
  code: string; // REST event code (T0006...) or NVP type ("Payment")
  type: string; // plain words: Payment received, Refund, Fee, Withdrawal to bank...
  kind: Kind;
  direction: 'in' | 'out' | 'none';
  source: string; // PayPal Checkout, PayPal Payouts, Invoice, Subscription, PayPal payment, Bank...
  subject: string;
  items: { name: string; quantity: number; amount: number | null }[];
  payerName: string;
  payerEmail: string;
  payerId: string;
  gross: number;
  fee: number;
  net: number;
  currency: string;
  status: 'Completed' | 'Pending' | 'Reversed' | 'Denied' | 'Other';
  invoiceId: string;
  reference: string; // paypal_reference_id (the related transaction)
  custom: string; // custom_field (our ledger entry id for Checkout purchases)
};

type Mode = 'rest' | 'nvp' | 'none';
type Cache = {
  mode: Mode;
  syncedTo: string | null; // read up to here
  syncedAt: string | null; // last attempt
  error: string | null;
  version: number;
  detailed: string[]; // NVP: transactions whose details (items) were read, or that failed DETAILS_MAX_TRIES times
  detailFailures?: Record<string, number>; // NVP: failed detail reads per transaction, retried on later syncs
  txns: Record<string, PayPalTxn>;
};

const env = (name: string) => process.env[name]?.trim() || undefined;
const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => {
  const n = Number(String(v ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};
/** "2026-10-22T11:00:28+0000" -> ISO (Date.parse wants "+00:00"). */
const isoOf = (raw: unknown) => {
  const s = String(raw ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date(0).toISOString();
};
const paypalDate = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '-0000');

// ---------- Credentials ----------

export function restCredentials(biz: BusinessAccount) {
  for (const prefix of biz.restEnvPrefixes) {
    const id = env(`${prefix}_CLIENT_ID`);
    const secret = env(`${prefix}_CLIENT_SECRET`);
    if (id && secret) return { id, secret, prefix };
  }
  return null;
}

function nvpCredentials(biz: BusinessAccount) {
  const user = env(`${biz.apiEnvPrefix}_API_USERNAME`);
  const pwd = env(`${biz.apiEnvPrefix}_API_PASSWORD`);
  const signature = env(`${biz.apiEnvPrefix}_API_SIGNATURE`);
  return user && pwd && signature ? { user, pwd, signature } : null;
}

const modeOf = (biz: BusinessAccount): Mode => (restCredentials(biz) ? 'rest' : nvpCredentials(biz) ? 'nvp' : 'none');

// ---------- REST ----------

const tokens = new Map<string, { token: string; expires: number }>();

async function restToken(c: { id: string; secret: string }) {
  const hit = tokens.get(c.id);
  if (hit && hit.expires > Date.now() + 60_000) return hit.token;
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${c.id}:${c.secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`PayPal rejected the app's client id/secret (${body.error_description ?? res.status})`);
  tokens.set(c.id, { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3000) * 1000 });
  return body.access_token;
}

/** GET a PayPal REST path with the business's own app. */
export async function restGet(biz: BusinessAccount, pathAndQuery: string) {
  const c = restCredentials(biz);
  if (!c) throw new Error('No REST app for this business');
  const res = await fetch(`${BASE}${pathAndQuery}`, {
    headers: { authorization: `Bearer ${await restToken(c)}` },
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) {
    const why = body.message ?? body.name ?? `HTTP ${res.status}`;
    if (res.status === 403 || body.name === 'NOT_AUTHORIZED') {
      throw new Error(`PayPal says this app may not read your account reports (${why}). Turn on "Transaction search" for the app (${c.prefix}_CLIENT_ID) at developer.paypal.com > Apps & Credentials > the app > Features.`);
    }
    throw new Error(`PayPal ${res.status}: ${why}`);
  }
  return body;
}

const REST_STATUS: Record<string, PayPalTxn['status']> = { S: 'Completed', P: 'Pending', V: 'Reversed', D: 'Denied' };

function classifyRest(code: string, gross: number, invoiceId: string): Pick<PayPalTxn, 'type' | 'kind' | 'direction' | 'source'> {
  const direction: PayPalTxn['direction'] = gross > 0 ? 'in' : gross < 0 ? 'out' : 'none';
  const group = code.slice(0, 3);
  if (code === 'T0001') return { type: direction === 'out' ? 'Payout sent' : 'Payout received', kind: direction === 'in' ? 'sale' : 'other', direction, source: 'PayPal Payouts' };
  if (group === 'T00') {
    const source = invoiceId ? 'Invoice'
      : code === 'T0002' ? 'Subscription'
      : ['T0003', 'T0005', 'T0006', 'T0007', 'T0011', 'T0012'].includes(code) ? 'PayPal Checkout'
      : code === 'T0013' ? 'Donation'
      : 'PayPal payment';
    return { type: direction === 'out' ? 'Payment sent' : 'Payment received', kind: direction === 'in' ? 'sale' : 'other', direction, source };
  }
  const simple = (type: string, kind: Kind, source = 'PayPal') => ({ type, kind, direction, source });
  switch (group) {
    case 'T01': return simple('Fee', 'fee');
    case 'T02': return simple('Currency conversion', 'transfer');
    case 'T03': return simple('Added from bank', 'transfer', 'Bank');
    case 'T04': return simple('Withdrawal to bank', 'transfer', 'Bank');
    case 'T05': case 'T06': case 'T07': return simple('Card transaction', 'transfer', 'Card');
    case 'T08': return simple('Rewards', 'other');
    case 'T09': return simple('Gift or voucher', 'other');
    case 'T10': return simple('Bill payment', 'other');
    case 'T11': return simple(code === 'T1107' ? 'Refund' : code === 'T1106' ? 'Payment reversal' : ['T1110', 'T1111'].includes(code) ? 'Dispute hold' : 'Reversal', 'refund');
    case 'T12': return simple('Adjustment', 'other');
    case 'T13': return simple('Authorization', 'none');
    case 'T15': return simple('Hold or release', 'none');
    case 'T19': return simple('Correction', 'other');
    case 'T20': case 'T22': return simple('Transfer', 'transfer');
    case 'T21': return simple('Reserve', 'none');
    default: return simple('Other', 'other');
  }
}

function fromRest(d: Record<string, any>): PayPalTxn {
  const t = d.transaction_info ?? {};
  const p = d.payer_info ?? {};
  const gross = num(t.transaction_amount?.value);
  const fee = num(t.fee_amount?.value);
  const invoiceId = String(t.invoice_id ?? '');
  const code = String(t.transaction_event_code ?? '');
  const name = p.payer_name?.alternate_full_name || [p.payer_name?.given_name, p.payer_name?.surname].filter(Boolean).join(' ');
  return {
    id: String(t.transaction_id),
    at: isoOf(t.transaction_initiation_date),
    code,
    ...classifyRest(code, gross, invoiceId),
    subject: String(t.transaction_subject || t.transaction_note || ''),
    items: ((d.cart_info?.item_details ?? []) as any[])
      .map((i) => ({ name: String(i.item_name ?? '').trim(), quantity: num(i.item_quantity ?? 1) || 1, amount: i.item_amount?.value != null ? num(i.item_amount.value) : null }))
      .filter((i) => i.name),
    payerName: String(name || ''),
    payerEmail: String(p.email_address ?? ''),
    payerId: String(p.account_id ?? ''),
    gross,
    fee,
    net: round2(gross + fee),
    currency: String(t.transaction_amount?.currency_code ?? 'USD'),
    status: REST_STATUS[t.transaction_status] ?? 'Other',
    invoiceId,
    reference: String(t.paypal_reference_id ?? ''),
    custom: String(t.custom_field ?? ''),
  };
}

async function restSearch(biz: BusinessAccount, from: Date, to: Date) {
  const out: PayPalTxn[] = [];
  for (let page = 1; ; page++) {
    const q = new URLSearchParams({
      start_date: paypalDate(from), end_date: paypalDate(to),
      fields: 'transaction_info,payer_info,cart_info', page_size: '500', page: String(page),
    });
    const body = await restGet(biz, `/v1/reporting/transactions?${q}`);
    for (const d of body.transaction_details ?? []) if (d.transaction_info?.transaction_id) out.push(fromRest(d));
    if (!body.total_pages || page >= body.total_pages) break;
  }
  return out;
}

// ---------- Classic NVP ----------

async function nvpCall(c: { user: string; pwd: string; signature: string }, params: Record<string, string>) {
  const body = new URLSearchParams({ USER: c.user, PWD: c.pwd, SIGNATURE: c.signature, VERSION: '204', ...params });
  const res = await fetch(NVP, { method: 'POST', body, signal: AbortSignal.timeout(30_000) });
  const out = Object.fromEntries(new URLSearchParams(await res.text()));
  if (!res.ok || !/^Success/.test(out.ACK ?? '')) {
    throw new Error(`PayPal ${params.METHOD} failed: ${out.L_LONGMESSAGE0 ?? out.L_SHORTMESSAGE0 ?? `HTTP ${res.status}`}`);
  }
  return out;
}

const NVP_STATUS = (s: string): PayPalTxn['status'] =>
  /complet|cleared|success/i.test(s) ? 'Completed' : /pend|process|unclaimed|held/i.test(s) ? 'Pending' : /revers|refund|cancel/i.test(s) ? 'Reversed' : /denied|fail/i.test(s) ? 'Denied' : 'Other';

function classifyNvp(type: string, gross: number): Pick<PayPalTxn, 'type' | 'kind' | 'direction' | 'source'> {
  const direction: PayPalTxn['direction'] = gross > 0 ? 'in' : gross < 0 ? 'out' : 'none';
  const t = type.toLowerCase();
  if (/mass ?pay|payout/.test(t)) return { type: direction === 'out' ? 'Payout sent' : 'Payout received', kind: direction === 'in' ? 'sale' : 'other', direction, source: 'PayPal Payouts' };
  if (/refund/.test(t)) return { type: 'Refund', kind: 'refund', direction, source: 'PayPal' };
  if (/revers|chargeback|dispute/.test(t)) return { type: 'Reversal', kind: 'refund', direction, source: 'PayPal' };
  if (/fee/.test(t)) return { type: 'Fee', kind: 'fee', direction, source: 'PayPal' };
  if (/withdraw/.test(t)) return { type: 'Withdrawal to bank', kind: 'transfer', direction, source: 'Bank' };
  if (/deposit|transfer|add funds/.test(t)) return { type: 'Transfer', kind: 'transfer', direction, source: 'Bank' };
  if (/currency/.test(t)) return { type: 'Currency conversion', kind: 'transfer', direction, source: 'PayPal' };
  if (/authori[sz]/.test(t)) return { type: 'Authorization', kind: 'none', direction, source: 'PayPal' };
  if (/payment|received|recurring|donation|invoice|purchase/.test(t)) {
    const source = /recurring/.test(t) ? 'Subscription' : /invoice/.test(t) ? 'Invoice' : /donation/.test(t) ? 'Donation' : 'PayPal payment';
    return { type: direction === 'out' ? 'Payment sent' : 'Payment received', kind: direction === 'in' ? 'sale' : 'other', direction, source };
  }
  return { type: type || 'Other', kind: 'other', direction, source: 'PayPal' };
}

async function nvpSearch(biz: BusinessAccount, from: Date, to: Date): Promise<PayPalTxn[]> {
  const c = nvpCredentials(biz)!;
  const out = await nvpCall(c, { METHOD: 'TransactionSearch', STARTDATE: from.toISOString(), ENDDATE: to.toISOString() });
  // 11002: more than 100 results. Split the range and read both halves.
  if (Object.entries(out).some(([k, v]) => /^L_ERRORCODE\d+$/.test(k) && v === '11002') && to.getTime() - from.getTime() > 3_600_000) {
    const mid = new Date((from.getTime() + to.getTime()) / 2);
    return [...(await nvpSearch(biz, from, mid)), ...(await nvpSearch(biz, mid, to))];
  }
  const rows: PayPalTxn[] = [];
  for (let i = 0; out[`L_TRANSACTIONID${i}`]; i++) {
    const gross = num(out[`L_AMT${i}`]);
    const net = out[`L_NETAMT${i}`] != null ? num(out[`L_NETAMT${i}`]) : gross + num(out[`L_FEEAMT${i}`]);
    const type = out[`L_TYPE${i}`] ?? '';
    rows.push({
      id: out[`L_TRANSACTIONID${i}`]!,
      at: isoOf(out[`L_TIMESTAMP${i}`]),
      code: type,
      ...classifyNvp(type, gross),
      subject: '',
      items: [],
      payerName: out[`L_NAME${i}`] ?? '',
      payerEmail: out[`L_EMAIL${i}`] ?? '',
      payerId: '',
      gross,
      fee: round2(net - gross),
      net: round2(net),
      currency: out[`L_CURRENCYCODE${i}`] ?? 'USD',
      status: NVP_STATUS(out[`L_STATUS${i}`] ?? ''),
      invoiceId: '',
      reference: '',
      custom: '',
    });
  }
  return rows;
}

/** NVP lists have no item names: read them (and invoice / custom / payer id) for a sale, once. */
async function nvpDetails(biz: BusinessAccount, t: PayPalTxn) {
  const out = await nvpCall(nvpCredentials(biz)!, { METHOD: 'GetTransactionDetails', TRANSACTIONID: t.id });
  const items: PayPalTxn['items'] = [];
  for (let i = 0; out[`L_NAME${i}`] != null || out[`L_NUMBER${i}`] != null; i++) {
    const name = String(out[`L_NAME${i}`] ?? '').trim();
    if (name) items.push({ name, quantity: num(out[`L_QTY${i}`] ?? 1) || 1, amount: out[`L_AMT${i}`] != null ? num(out[`L_AMT${i}`]) : null });
  }
  t.items = items;
  t.subject = out.SUBJECT ?? out.NOTE ?? t.subject;
  t.invoiceId = out.INVNUM ?? '';
  t.custom = out.CUSTOM ?? '';
  t.payerId = out.PAYERID ?? '';
  if (t.invoiceId && t.kind === 'sale') t.source = 'Invoice';
  if (!t.payerName) t.payerName = [out.FIRSTNAME, out.LASTNAME].filter(Boolean).join(' ') || out.BUSINESS || '';
}

// ---------- Cache + sync ----------

const caches = new Map<string, Cache>();
const running = new Map<string, Promise<void>>();
const fileOf = (biz: BusinessAccount) => `${DATA_DIR}paypal-transactions-${biz.username}.json`;
const emptyCache = (mode: Mode): Cache => ({ mode, syncedTo: null, syncedAt: null, error: null, version: 0, detailed: [], txns: {} });

async function cacheOf(biz: BusinessAccount) {
  let cache = caches.get(biz.username);
  if (!cache) {
    cache = await readFile(fileOf(biz), 'utf8').then((t) => JSON.parse(t) as Cache).catch(() => emptyCache(modeOf(biz)));
    caches.set(biz.username, cache);
  }
  // Credentials changed (e.g. a REST app was added): read the history again with the new source.
  const mode = modeOf(biz);
  if (cache.mode !== mode) Object.assign(cache, { mode, syncedTo: null, error: null, detailed: [], detailFailures: {} });
  return cache;
}

async function save(biz: BusinessAccount, cache: Cache) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileOf(biz), JSON.stringify(cache));
}

/** Read new transactions from PayPal into the cache (one sync at a time per business). */
export function syncTransactions(biz: BusinessAccount, { force = false } = {}): Promise<void> {
  const busy = running.get(biz.username);
  if (busy) return busy;
  const job = (async () => {
    const cache = await cacheOf(biz);
    if (!force && cache.syncedAt && Date.now() - Date.parse(cache.syncedAt) < SYNC_EVERY_MS) return;
    cache.syncedAt = new Date().toISOString();
    if (cache.mode === 'none') {
      cache.error = `Not connected: add ${biz.restEnvPrefixes[0]}_CLIENT_ID / _CLIENT_SECRET (REST app with Transaction search) or ${biz.apiEnvPrefix}_API_USERNAME / _API_PASSWORD / _API_SIGNATURE to .env`;
      return;
    }
    try {
      const to = new Date(Date.now() - 60_000);
      let from = cache.syncedTo ? new Date(Date.parse(cache.syncedTo) - OVERLAP_MS) : new Date(to.getTime() - HISTORY_DAYS * DAY_MS);
      let changed = false;
      while (from < to) {
        const end = new Date(Math.min(to.getTime(), from.getTime() + CHUNK_DAYS * DAY_MS));
        const found = cache.mode === 'rest' ? await restSearch(biz, from, end) : await nvpSearch(biz, from, end);
        for (const t of found) {
          const old = cache.txns[t.id];
          if (old && cache.mode === 'nvp') Object.assign(t, { items: old.items, subject: old.subject, invoiceId: old.invoiceId, custom: old.custom, payerId: old.payerId, source: old.source });
          if (!old || JSON.stringify(old) !== JSON.stringify(t)) { cache.txns[t.id] = t; changed = true; }
        }
        from = end;
      }
      if (cache.mode === 'nvp') {
        const done = new Set(cache.detailed);
        const failures = (cache.detailFailures ??= {});
        const todo = Object.values(cache.txns).filter((t) => t.kind === 'sale' && !done.has(t.id)).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, DETAILS_PER_SYNC);
        for (let i = 0; i < todo.length; i += 3) {
          await Promise.all(todo.slice(i, i + 3).map(async (t) => {
            try {
              await nvpDetails(biz, t);
              delete failures[t.id];
              done.add(t.id);
              changed = true;
            } catch (err) {
              // A passing PayPal error should not cost the item names for good: retry on the next syncs.
              failures[t.id] = (failures[t.id] ?? 0) + 1;
              console.warn(`[transactions] details ${t.id} (try ${failures[t.id]}/${DETAILS_MAX_TRIES}): ${(err as Error).message.slice(0, 120)}`);
              if (failures[t.id]! >= DETAILS_MAX_TRIES) { delete failures[t.id]; done.add(t.id); }
            }
          }));
        }
        cache.detailed = [...done];
      }
      cache.syncedTo = to.toISOString();
      cache.error = null;
      if (changed) cache.version++;
    } catch (err) {
      cache.error = (err as Error).message.split('\n')[0]!.slice(0, 300);
      console.warn(`[transactions] ${biz.username}: ${cache.error}`);
    } finally {
      await save(biz, cache).catch((err: Error) => console.warn(`[transactions] could not save cache: ${err.message}`));
    }
  })().finally(() => running.delete(biz.username));
  running.set(biz.username, job);
  return job;
}

/** Cached PayPal transactions; starts a background sync when due (waits only for the very first one). */
export async function paypalTransactions(biz: BusinessAccount) {
  const cache = await cacheOf(biz);
  const first = !cache.syncedTo && !cache.syncedAt;
  const job = syncTransactions(biz);
  if (first) await Promise.race([job, new Promise((r) => setTimeout(r, 25_000))]);
  return Object.values(cache.txns);
}

export async function connection(biz: BusinessAccount) {
  const cache = await cacheOf(biz);
  const label = { rest: 'PayPal REST Transaction Search', nvp: 'PayPal classic API (TransactionSearch)', none: 'Not connected' }[cache.mode];
  return {
    mode: cache.mode,
    label,
    connected: cache.mode !== 'none' && !cache.error && Boolean(cache.syncedTo),
    error: cache.error,
    syncedAt: cache.syncedAt,
    syncedTo: cache.syncedTo,
    syncing: running.has(biz.username),
    count: Object.keys(cache.txns).length,
  };
}

/** Changes whenever the cached transactions change (part of the page's refresh signal). */
export async function transactionsVersion(biz: BusinessAccount) {
  const cache = await cacheOf(biz);
  syncTransactions(biz); // keep it fresh while the page is open (no-op until due)
  return `${cache.mode}:${cache.version}`;
}
