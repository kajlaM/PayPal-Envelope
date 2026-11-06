// Seller side of agentic commerce: what a shop sees of the AI agents that buy from it.
// Read-only views over data PayPalVault already keeps (ledger, decisions, proposals, policies):
//   orders()  - every purchase an agent made from this business, with why the agent was allowed to buy
//   missed()  - every time an agent wanted to buy here but did not, and why (the sale the shop lost)
//   ask()     - plain English -> AG Grid filters / sort / grouping (our AI; AG Grid's AI Toolkit is Enterprise)
// Privacy: customers are anonymised per business ("Customer 7F2"); vault names, balances and owners
// never leave this file.

import { createHmac } from 'node:crypto';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@paypalvault/db';
import { policyModels } from '@paypalvault/policy';
import { c3, priceHistory, priceVerdict } from '@paypalvault/agents';
import type { BusinessAccount } from './accounts.ts';

const SECRET = process.env.INTERNAL_API_KEY?.trim() ?? '';
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const toCents = (value: unknown) => Math.round(Number(value ?? 0) * 100);

/** Same customer -> same label for one business, but not linkable across businesses. */
function customerLabel(biz: BusinessAccount, userId: string) {
  return `Customer ${createHmac('sha256', SECRET).update(`${biz.username}:${userId}`).digest('hex').slice(0, 3).toUpperCase()}`;
}

/**
 * This business's own shop: the registered merchant with the business's name (e.g. "Audio Store").
 * Only its own sales show, never another shop's. (In the sandbox, BestBuy / Target / Walmart are
 * stand-in merchants that happen to pay out to the same PayPal test account; they are not Audio Store.)
 */
export async function storefronts(biz: BusinessAccount) {
  return prisma.merchant.findMany({
    where: { name: { equals: biz.name, mode: 'insensitive' } },
    select: { id: true, name: true, category: true },
  });
}

type Rules = {
  max_single_transaction?: number;
  allowed_categories?: string[];
  approved_merchants?: string[];
  control_mode?: string;
  human_approval_above?: number;
  max_transactions_per_day?: number;
};

/** The vault's rules as they were at `at` (the newest policy version created before it). */
function rulesAt(policies: { createdAt: Date; policyJson: unknown }[], at: Date): Rules {
  let found: unknown = policies[0]?.policyJson;
  for (const p of policies) if (p.createdAt <= at) found = p.policyJson;
  return ((found as { rules?: Rules } | undefined)?.rules ?? {}) as Rules;
}

async function policiesFor(vaultIds: string[]) {
  const rows = await prisma.policy.findMany({
    where: { vaultId: { in: [...new Set(vaultIds)] } },
    orderBy: { version: 'asc' },
    select: { vaultId: true, createdAt: true, policyJson: true },
  });
  const byVault = new Map<string, typeof rows>();
  for (const row of rows) (byVault.get(row.vaultId) ?? byVault.set(row.vaultId, []).get(row.vaultId)!).push(row);
  return byVault;
}

/** Bill payments only say "bill": name them after the bill's category, e.g. "Electricity bill". */
const productName = (text: unknown, category: unknown) => {
  const name = String(text ?? '').trim();
  if (!name || /^(bill|bill payment)$/i.test(name)) return category ? `${category} bill` : 'Bill payment';
  return name;
};

const PAID_VIA: Record<string, string> = { CHECKOUT: 'PayPal Checkout', PAYOUTS: 'PayPal Payouts' };
const STATUS: Record<string, string> = { COMPLETED: 'Paid', PENDING: 'Pending', FAILED: 'Failed' };

// ---------- Orders: purchases agents made from this business ----------

export async function orders(biz: BusinessAccount) {
  const shops = await storefronts(biz);
  const entries = await prisma.ledgerEntry.findMany({
    where: { type: 'SPEND', merchantId: { in: shops.map((s) => s.id) } },
    orderBy: { createdAt: 'desc' },
    include: {
      merchant: { select: { name: true } },
      decision: { select: { requestJson: true, resolvedBy: true, createdAt: true } },
      vault: { select: { userId: true, type: true } },
    },
  });
  const policies = await policiesFor(entries.map((e) => e.vaultId));

  return entries.map((e) => {
    const req = (e.decision?.requestJson ?? {}) as Record<string, any>;
    const rules = rulesAt(policies.get(e.vaultId) ?? [], e.decision?.createdAt ?? e.createdAt);
    const shop = e.merchant?.name ?? '';
    const checks: string[] = [];
    if (rules.max_single_transaction !== undefined) {
      checks.push(`${dollars(e.amountCents)} is within the customer's ${dollars(toCents(rules.max_single_transaction))} per-payment limit`);
    }
    if (req.category && rules.allowed_categories?.length) {
      checks.push(`${req.category} is an allowed category (${rules.allowed_categories.join(', ')})`);
    }
    if (rules.approved_merchants?.length) checks.push(`${shop} is on the customer's allowed shops`);
    if (rules.max_transactions_per_day !== undefined) checks.push(`Under ${rules.max_transactions_per_day} purchases a day`);
    if (req.invoice_id) checks.push(`Matched open PayPal invoice ${req.invoice_id} for the same amount`);

    const verified = req.verified_price !== undefined && req.verified_price !== null;
    const price = verified
      ? `Live price checked at checkout: ${dollars(toCents(req.verified_price))}`
      : e.vault.type === 'UTILITY' ? 'Amount taken from the bill' : 'Live price was not checked';

    const resolved = e.decision?.resolvedBy;
    const mode = rules.control_mode;
    const approval =
      resolved === 'CHOSEN_BY_OWNER' ? 'Customer picked this one from the options the agent found'
      : resolved === 'APPROVED_BY_HUMAN' ? 'Customer approved it (it needed a human OK first)'
      : mode === 'ASK_ABOVE' && rules.human_approval_above !== undefined ? `Below the customer's ask-me amount (${dollars(toCents(rules.human_approval_above))}), so the agent bought it on its own`
      : 'Autopilot: within all the customer\'s rules, no approval needed';

    return {
      id: e.id,
      at: e.createdAt.toISOString(),
      product: productName(e.note || req.reason, req.category),
      category: req.category ?? '',
      storefront: shop,
      amount: e.amountCents / 100,
      paidVia: PAID_VIA[e.paidVia ?? ''] ?? 'PayPal Payouts',
      status: STATUS[e.status] ?? e.status,
      customer: customerLabel(biz, e.vault.userId),
      approval: resolved === 'CHOSEN_BY_OWNER' ? 'Picked by customer' : resolved === 'APPROVED_BY_HUMAN' ? 'Approved by customer' : 'Autopilot',
      paypalRef: e.paypalTxnId ?? e.paypalRef ?? '',
      // "Verified by PayPal": the last read-only check of this payment against PayPal's own records.
      paypal: e.paypalCheck === 'VERIFIED' ? 'Confirmed' : e.paypalCheck === 'MISMATCH' ? 'Differs' : e.paypalCheck === 'WAITING' ? 'Processing' : 'Not checked',
      paypalNote: e.paypalCheck === 'VERIFIED' ? 'Confirmed in your PayPal account' : e.paypalCheckNote ?? 'Not checked against PayPal yet',
      why: { checks, price, approval },
    };
  });
}

// ---------- Missed sales: agents wanted to buy here, but did not ----------

type Missed = { group: string; detail: string };

/** Plain-words reason for one blocked/declined attempt, with the numbers the shop can act on. */
function explain(code: string, req: Record<string, any>, rules: Rules, shop: string): Missed {
  const amount = toCents(req.amount);
  const limit = rules.max_single_transaction !== undefined ? toCents(rules.max_single_transaction) : null;
  switch (code) {
    case 'MAX_LIMIT_EXCEEDED':
    case 'ITEM_LIMIT_EXCEEDED':
      return { group: 'Over the customer\'s price limit', detail: limit !== null ? `Priced ${dollars(amount)}, customer allows up to ${dollars(limit)}` : `Priced ${dollars(amount)}, above the customer's limit` };
    case 'ABOVE_HUMAN_APPROVAL_THRESHOLD':
      return { group: 'Over the customer\'s price limit', detail: `Priced ${dollars(amount)}, above the amount the customer lets the agent spend alone` };
    case 'PRICE_MISMATCH':
      return { group: 'Price changed at checkout', detail: req.verified_price != null ? `Listed ${dollars(amount)}, live checkout price ${dollars(toCents(req.verified_price))}` : 'The checkout price differed from the listing' };
    case 'PRICE_NOT_VERIFIED':
      return { group: 'Price could not be checked', detail: 'The agent could not confirm the live price on your product page' };
    case 'INSUFFICIENT_VAULT_BALANCE':
    case 'VAULT_INACTIVE':
    case 'VAULT_EXPIRED':
    case 'STILL_SAVING':
      return { group: 'Customer\'s budget ran out', detail: `The customer's budget could not cover ${dollars(amount)}` };
    case 'MERCHANT_NOT_APPROVED':
    case 'MERCHANT_NOT_REGISTERED':
      return { group: 'Shop not on the customer\'s list', detail: `${shop} is not one of the shops the customer allows` };
    case 'CATEGORY_NOT_ALLOWED':
      return { group: 'Category not allowed', detail: `${req.category ?? 'This category'} is not in the customer's categories${rules.allowed_categories?.length ? ` (${rules.allowed_categories.join(', ')})` : ''}` };
    case 'DAILY_LIMIT_REACHED':
      return { group: 'Customer\'s daily limit reached', detail: 'The customer had already bought the maximum for that day' };
    case 'POSSIBLE_DUPLICATE':
      return { group: 'Looked like a repeat order', detail: 'Same shop and amount within 10 minutes, so the customer was asked first' };
    case 'POLICY_CHANGED':
      return { group: 'Customer changed their rules', detail: 'The customer edited their rules while the agent was checking out' };
    case 'REJECTED_BY_HUMAN':
      return { group: 'Customer said no', detail: 'The agent asked, and the customer declined' };
    case 'NOT_PICKED':
      return { group: 'Customer picked another option', detail: 'Shown to the customer as an option, they chose a different one' };
    case 'ALL_REJECTED':
      return { group: 'Customer said no', detail: 'Shown to the customer as an option, they rejected all options' };
    case 'SYSTEM_ERROR':
      return { group: 'Payment error', detail: 'Something failed while paying; nothing was charged' };
    default:
      if (code.startsWith('INVOICE_')) {
        const text: Record<string, string> = {
          INVOICE_REQUIRED: 'The agent had no bill to match the payment to',
          INVOICE_NOT_FOUND: 'The bill could not be found on PayPal',
          INVOICE_NOT_OPEN: 'The bill was already paid or closed',
          INVOICE_MISMATCH: 'The amount differed from your bill',
          INVOICE_MERCHANT_MISMATCH: 'The bill was issued by another company',
        };
        return { group: 'Bill did not match', detail: text[code] ?? 'Bill problem' };
      }
      return { group: 'Other', detail: code.toLowerCase().replace(/_/g, ' ') };
  }
}

/** Which reasons matter most when a payment was blocked for several at once. */
const REASON_ORDER = ['MERCHANT_NOT_APPROVED', 'CATEGORY_NOT_ALLOWED', 'MAX_LIMIT_EXCEEDED', 'ITEM_LIMIT_EXCEEDED', 'PRICE_MISMATCH', 'INSUFFICIENT_VAULT_BALANCE'];
const mainReason = (codes: string[]) => [...codes].sort((a, b) => (REASON_ORDER.indexOf(a) + 1 || 99) - (REASON_ORDER.indexOf(b) + 1 || 99))[0] ?? 'OTHER';

export async function missed(biz: BusinessAccount) {
  const shops = await storefronts(biz);
  const names = new Map(shops.map((s) => [s.name.toLowerCase(), s.name]));
  const ours = (merchant: unknown) => names.get(String(merchant ?? '').toLowerCase());

  const decisions = await prisma.decision.findMany({
    where: { OR: [{ result: 'BLOCK' }, { result: 'NEEDS_HUMAN', resolvedBy: 'REJECTED_BY_HUMAN' }] },
    orderBy: { createdAt: 'desc' },
    select: { id: true, vaultId: true, requestJson: true, reasons: true, resolvedBy: true, createdAt: true, vault: { select: { userId: true } } },
  });
  const proposals = await prisma.proposal.findMany({
    where: { status: { in: ['CHOSEN', 'REJECTED'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, vaultId: true, options: true, status: true, chosenIndex: true, createdAt: true, resolvedAt: true, vault: { select: { userId: true } } },
  });

  type Row = { id: string; vaultId: string; userId: string; at: Date; req: Record<string, any>; code: string; codes: string[] };
  const raw: Row[] = [];
  for (const d of decisions) {
    const req = (d.requestJson ?? {}) as Record<string, any>;
    if (!ours(req.merchant)) continue;
    const code = d.resolvedBy === 'REJECTED_BY_HUMAN' ? 'REJECTED_BY_HUMAN' : mainReason(d.reasons);
    raw.push({ id: d.id, vaultId: d.vaultId, userId: d.vault.userId, at: d.createdAt, req, code, codes: d.reasons });
  }
  for (const p of proposals) {
    const options = (Array.isArray(p.options) ? p.options : []) as Record<string, any>[];
    options.forEach((o, i) => {
      if (!ours(o.merchant) || (p.status === 'CHOSEN' && i === p.chosenIndex)) return;
      raw.push({
        id: `${p.id}:${i}`, vaultId: p.vaultId, userId: p.vault.userId, at: p.resolvedAt ?? p.createdAt,
        req: { amount: o.price, reason: o.title, category: o.category, merchant: o.merchant, channel3: o.channel3 },
        code: p.status === 'CHOSEN' ? 'NOT_PICKED' : 'ALL_REJECTED', codes: [],
      });
    });
  }

  const policies = await policiesFor(raw.map((r) => r.vaultId));
  return raw
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((r) => {
      const rules = rulesAt(policies.get(r.vaultId) ?? [], r.at);
      const shop = ours(r.req.merchant)!;
      const { group, detail } = explain(r.code, r.req, rules, shop);
      const limit = rules.max_single_transaction;
      return {
        id: r.id,
        at: r.at.toISOString(),
        product: productName(r.req.reason, r.req.category),
        category: r.req.category ?? '',
        storefront: shop,
        amount: toCents(r.req.amount) / 100,
        customerLimit: limit === undefined || ['NOT_PICKED', 'ALL_REJECTED'].includes(r.code) ? null : Number(limit),
        reason: group,
        detail,
        customer: customerLabel(biz, r.userId),
        allReasons: r.codes.map((c) => explain(c, r.req, rules, shop).group).filter((g, i, all) => all.indexOf(g) === i),
        channel3Id: (r.req.channel3?.product_id as string | undefined) ?? null,
      };
    });
}

// ---------- Market check for missed sales (Channel3) ----------
// For each product an agent wanted but did not buy here: what the same product costs at other stores
// right now, and whether that price is low / typical / high for the last 90 days.
//   - Known Channel3 product (saved with newer purchases and options): read it by id (free).
//   - Older rows: one Channel3 search by product name, used only when the titles clearly match.
// Cached for 12 hours per product, so a dashboard reload costs no Channel3 credits.

export type Market = {
  marketLow: number;
  cheapestAt: string;
  stores: { store: string; price: number }[];
  trend: 'low' | 'typical' | 'high' | null;
  average: number | null;
  days: number | null;
  matched: string; // Channel3's product title
};

const MARKET_TTL_MS = 12 * 60 * 60_000;
const markets = new Map<string, { at: number; value: Market | null }>();

const STOP_WORDS = new Set(['with', 'for', 'and', 'the', 'new', 'wireless', 'bluetooth', 'black', 'white', 'over', 'ear', 'on-ear']);
const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP_WORDS.has(w)));
const modelCode = (t: string) => t.toLowerCase().split(/[\s,()/|]+/).map((w) => w.replace(/[^a-z0-9]/g, ''))
  .filter((w) => w.length >= 3 && /[a-z]/.test(w) && /\d/.test(w)).sort((a, b) => b.length - a.length)[0] ?? null;

/**
 * Same product, matched by name (older rows without a Channel3 id): the same model code, or 3+ real
 * words in common; and a believable price. A wrong market price is worse than none.
 */
function sameProduct(wanted: { title: string; price: number }, found: { title: string; price: number }) {
  const code = modelCode(wanted.title);
  const named = code ? code === modelCode(found.title) : (() => {
    const a = words(wanted.title);
    const b = words(found.title);
    let n = 0;
    for (const w of a) if (b.has(w)) n++;
    return n >= 3;
  })();
  return named && found.price >= wanted.price * 0.4 && found.price <= wanted.price * 2.5;
}

/** "www.bestbuy.com" -> "BestBuy" (registered merchants), else "Amazon" from "amazon.com". */
async function storeNames() {
  const merchants = await prisma.merchant.findMany({ where: { domain: { not: null } }, select: { name: true, domain: true } });
  const known = new Map(merchants.map((m) => [m.domain!.toLowerCase(), m.name]));
  return (domain: string) => {
    const host = domain.toLowerCase().replace(/^www\./, '');
    if (known.has(host)) return known.get(host)!;
    const label = host.split('.')[0] ?? host;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
}

const lowestPrice = (p: any) => Math.min(...(p.offers ?? []).map((o: any) => Number(o.price?.price)).filter((n: number) => n > 0), Infinity);

async function lookupMarket(title: string, price: number, productId: string | null, name: (d: string) => string): Promise<Market | null> {
  let product: any = null;
  if (productId) product = await c3(`/v1/products/${encodeURIComponent(productId)}`).catch(() => null);
  if (!product) {
    if (!modelCode(title) && words(title).size < 3) return null; // too vague to look up ("Sony headphones")
    const found = await c3('/v1/search', { method: 'POST', body: JSON.stringify({ query: title.slice(0, 120), limit: 5, filters: { availability: ['InStock'] } }) });
    product = (found.products ?? []).find((p: any) => sameProduct({ title, price }, { title: p.title ?? '', price: lowestPrice(p) })) ?? null;
  }
  if (!product) return null;
  const offers = (product.offers ?? [])
    .filter((o: any) => (!o.availability || o.availability === 'InStock') && (!o.price?.currency || o.price.currency === 'USD') && Number(o.price?.price) > 0)
    .map((o: any) => ({ store: name(o.domain ?? new URL(o.url).hostname), price: Number(o.price.price) }))
    .sort((a: any, b: any) => a.price - b.price);
  if (!offers.length) return null;
  const history = await priceHistory(product.id);
  return {
    marketLow: offers[0].price,
    cheapestAt: offers[0].store,
    stores: offers.slice(0, 5),
    trend: history ? priceVerdict(offers[0].price, history) : null,
    average: history?.mean ?? null,
    days: history?.days ?? null,
    matched: String(product.title ?? ''),
  };
}

/** Market data per missed-sale row id (rows without a confident match are left out). */
export async function missedMarket(biz: BusinessAccount): Promise<Record<string, Market>> {
  if (!process.env.CHANNEL3_API_KEY?.trim()) return {};
  const rows = await missed(biz);
  const name = await storeNames();
  const keyOf = (r: (typeof rows)[number]) => r.channel3Id ?? r.product.toLowerCase();
  const todo = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!todo.has(keyOf(r))) todo.set(keyOf(r), r);

  // A few lookups at a time; each product at most once per 12 hours.
  const keys = [...todo.keys()];
  for (let i = 0; i < keys.length; i += 4) {
    await Promise.all(keys.slice(i, i + 4).map(async (key) => {
      const hit = markets.get(key);
      if (hit && Date.now() - hit.at < MARKET_TTL_MS) return;
      const r = todo.get(key)!;
      const value = await lookupMarket(r.product, r.amount, r.channel3Id, name).catch((err: Error) => {
        console.warn('[market] Channel3 lookup failed:', err.message.slice(0, 160));
        return null;
      });
      markets.set(key, { at: Date.now(), value });
    }));
  }
  const out: Record<string, Market> = {};
  for (const r of rows) {
    const m = markets.get(keyOf(r))?.value;
    if (m) out[r.id] = m;
  }
  return out;
}

// ---------- Ask the grid in plain English ----------

const GRID_COLUMNS = {
  orders: {
    at: 'date', product: 'text', category: 'text', storefront: 'text', amount: 'number', paidVia: 'text',
    status: 'text (Paid, Pending, Failed)', customer: 'text', approval: 'text (Autopilot, Picked by customer, Approved by customer)',
  },
  missed: {
    at: 'date', product: 'text', category: 'text', storefront: 'text', amount: 'number', customerLimit: 'number',
    reason: 'text', customer: 'text', marketLow: 'number (lowest price at any store, Channel3)', cheapestAt: 'text (store with the market low)',
    marketTrend: 'text (low, typical, high vs 90 days)',
  },
} as const;
export type GridName = keyof typeof GRID_COLUMNS;

const AskSchema = z.object({
  filters: z.array(z.object({
    column: z.string().describe('Column id from the list'),
    op: z.enum(['contains', 'equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange', 'after', 'before']),
    value: z.string().describe('Text, number, or date YYYY-MM-DD'),
    valueTo: z.string().nullable().describe('Upper bound for inRange, else null'),
  })).describe('Column filters; empty when none'),
  sort: z.array(z.object({ column: z.string(), direction: z.enum(['asc', 'desc']) })).describe('Sort order; empty to keep the default'),
  groupBy: z.string().nullable().describe('Column id to group rows by (with totals), or null'),
  search: z.string().nullable().describe('Free-text quick search across all columns, or null'),
  explanation: z.string().describe('One short sentence describing what the grid now shows'),
});
export type AskResult = z.infer<typeof AskSchema>;

const GROUPABLE: Record<GridName, string[]> = {
  orders: ['day', 'product', 'category', 'storefront', 'paidVia', 'status', 'customer', 'approval'],
  missed: ['reason', 'day', 'product', 'category', 'storefront', 'customer'],
};

/** Models that just said "out of quota" are skipped for a while instead of being retried on every question. */
const cooldown = new Map<string, number>();
const QUOTA_COOLDOWN_MS = 10 * 60_000;

export async function ask(grid: GridName, text: string, now = new Date()): Promise<AskResult & { model: string }> {
  const cols = GRID_COLUMNS[grid];
  const system = [
    `You turn a business owner's request into settings for a data grid of ${grid === 'orders' ? 'orders that AI shopping agents placed with their shop' : 'missed sales: purchases AI agents attempted at their shop but that were blocked or declined'}.`,
    `Columns (id: type): ${Object.entries(cols).map(([k, v]) => `${k}: ${v}`).join('; ')}.`,
    `Group-by options: ${GROUPABLE[grid].join(', ')} ("day" groups by date).`,
    `Today is ${now.toISOString().slice(0, 10)} (${now.toLocaleDateString('en-US', { weekday: 'long' })}). "This week" starts on Monday. Dates are YYYY-MM-DD.`,
    'Number columns are US dollars. For dates use after/before/inRange. For text use contains/equals/notEqual.',
    'Use only the listed column ids. Prefer column filters over search. Keep everything empty/null that the request does not ask for.',
    grid === 'orders' ? '"Refunds" or "failed" means status Failed. "Biggest" means amount descending.' : '"Too expensive" or "price limit" means reason contains "price limit". "Cheaper elsewhere" means marketLow less than amount (compare with a number filter only if a value is given).',
  ].join('\n');

  let lastError: unknown;
  for (const model of policyModels()) {
    if ((cooldown.get(model.modelId) ?? 0) > Date.now()) continue; // out of quota a moment ago: skip it for now
    try {
      const { object } = await generateObject({ model, schema: AskSchema, system, prompt: text, temperature: 0, maxRetries: 1 });
      const known = (c: string) => c in cols;
      return {
        filters: object.filters.filter((f) => known(f.column)),
        sort: object.sort.filter((s) => known(s.column)),
        groupBy: object.groupBy && GROUPABLE[grid].includes(object.groupBy) ? object.groupBy : null,
        search: object.search?.trim() || null,
        explanation: object.explanation,
        model: model.modelId,
      };
    } catch (err) {
      console.warn(`[business ask] ${model.provider}/${model.modelId} failed: ${(err as Error).message.slice(0, 160)}`);
      if (/quota|billing|rate limit|429/i.test((err as Error).message)) cooldown.set(model.modelId, Date.now() + QUOTA_COOLDOWN_MS);
      lastError = err;
    }
  }
  // Every AI model is down (quota used up, overloaded): understand the common requests ourselves,
  // so the grid still answers. Only when nothing is recognised does the owner see an error.
  const quick = quickAsk(grid, text, now);
  if (quick) return quick;
  throw new Error(`The AI is busy right now and that request needs it. Try a simpler one (e.g. "over $40 this week") or again in a minute. (${(lastError as Error)?.message.slice(0, 80) ?? ''})`);
}

// ---------- Built-in fallback: plain-English rules, no AI ----------

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The words people use for each grouping / text value, per grid. */
const GROUP_WORDS: Record<GridName, [RegExp, string][]> = {
  orders: [[/\b(day|date|daily)\b/, 'day'], [/\bproducts?\b/, 'product'], [/\bcategor(y|ies)\b/, 'category'], [/\b(paid via|payment method|method)\b/, 'paidVia'], [/\bstatus\b/, 'status'], [/\bcustomers?\b/, 'customer'], [/\b(approv\w*|how approved)\b/, 'approval']],
  missed: [[/\b(reasons?|why)\b/, 'reason'], [/\b(day|date|daily)\b/, 'day'], [/\bproducts?\b/, 'product'], [/\bcategor(y|ies)\b/, 'category'], [/\bcustomers?\b/, 'customer']],
};
const VALUE_WORDS: Record<GridName, [RegExp, { column: string; value: string; label: string }][]> = {
  orders: [
    [/\b(fail(ed|ures?)?|refund(s|ed)?)\b/, { column: 'status', value: 'Failed', label: 'that failed' }],
    [/\bpending\b/, { column: 'status', value: 'Pending', label: 'still pending' }],
    [/\bcheckout\b/, { column: 'paidVia', value: 'Checkout', label: 'paid with PayPal Checkout' }],
    [/\bpayouts?\b/, { column: 'paidVia', value: 'Payouts', label: 'paid with PayPal Payouts' }],
    [/\bautopilot\b/, { column: 'approval', value: 'Autopilot', label: 'bought on Autopilot' }],
    [/\b(picked|chose|chosen)\b/, { column: 'approval', value: 'Picked', label: 'picked by the customer' }],
    [/\bapproved\b/, { column: 'approval', value: 'Approved', label: 'approved by the customer' }],
  ],
  missed: [
    [/\b(too expensive|price limit|over (the )?limit|overpriced|expensive)\b/, { column: 'reason', value: 'price limit', label: 'over the customer\'s price limit' }],
    [/\bbudget\b/, { column: 'reason', value: 'budget', label: 'where the customer\'s budget ran out' }],
    [/\b(said no|declined|rejected|refused)\b/, { column: 'reason', value: 'said no', label: 'where the customer said no' }],
    [/\b(another option|other option|picked another|chose another)\b/, { column: 'reason', value: 'another option', label: 'where the customer picked another option' }],
    [/\b(price changed|price mismatch|checkout price)\b/, { column: 'reason', value: 'Price changed', label: 'where the price changed at checkout' }],
    [/\b(bill|invoice)\b/, { column: 'reason', value: 'Bill', label: 'where the bill did not match' }],
    [/\b(rules changed|changed (their )?rules)\b/, { column: 'reason', value: 'rules', label: 'where the customer changed their rules' }],
    [/\b(error|errors)\b/, { column: 'reason', value: 'error', label: 'with payment errors' }],
  ],
};
const STOP = new Set('show me all only the a an of in on for with from to and or by my our your this that last week weeks month months today yesterday day days over under above below more less than between biggest largest highest smallest cheapest lowest newest latest oldest recent first group sort sorted orders order sales sale missed payments payment what which were was are is it them those items item please list find get see view top'.split(' '));

export function quickAsk(grid: GridName, input: string, now = new Date()): (AskResult & { model: string }) | null {
  const text = input.toLowerCase().replace(/[,]/g, ' ');
  const filters: AskResult['filters'] = [];
  const sort: AskResult['sort'] = [];
  const said: string[] = [];
  let groupBy: string | null = null;

  // Money
  const money = '\\$?\\s?(\\d+(?:\\.\\d+)?)';
  const between = new RegExp(`between\\s+${money}\\s+(?:and|-|to)\\s+${money}`).exec(text);
  const over = new RegExp(`(?:over|above|more than|greater than|at least|>=?)\\s+${money}`).exec(text);
  const under = new RegExp(`(?:under|below|less than|at most|cheaper than|<=?)\\s+${money}`).exec(text);
  if (between) {
    filters.push({ column: 'amount', op: 'inRange', value: between[1]!, valueTo: between[2]! });
    said.push(`between $${between[1]} and $${between[2]}`);
  } else {
    if (over) { filters.push({ column: 'amount', op: /at least|>=/.test(over[0]) ? 'greaterThanOrEqual' : 'greaterThan', value: over[1]!, valueTo: null }); said.push(`over $${over[1]}`); }
    if (under) { filters.push({ column: 'amount', op: /at most|<=/.test(under[0]) ? 'lessThanOrEqual' : 'lessThan', value: under[1]!, valueTo: null }); said.push(`under $${under[1]}`); }
  }

  // Dates ("this week" starts on Monday)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const lastN = /(?:last|past)\s+(\d+)\s+days?/.exec(text);
  const range = (from: Date, to: Date, label: string) => { filters.push({ column: 'at', op: 'inRange', value: ymd(from), valueTo: ymd(to) }); said.push(label); };
  if (lastN) range(addDays(today, -Number(lastN[1]) + 1), today, `in the last ${lastN[1]} days`);
  else if (/\btoday\b/.test(text)) range(today, today, 'today');
  else if (/\byesterday\b/.test(text)) range(addDays(today, -1), addDays(today, -1), 'yesterday');
  else if (/\blast week\b/.test(text)) range(addDays(monday, -7), addDays(monday, -1), 'last week');
  else if (/\bthis week\b/.test(text)) range(monday, today, 'this week');
  else if (/\blast month\b/.test(text)) range(new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 0), 'last month');
  else if (/\bthis month\b/.test(text)) range(new Date(today.getFullYear(), today.getMonth(), 1), today, 'this month');

  // Known values (status, payment method, lost-sale reason...)
  for (const [re, f] of VALUE_WORDS[grid]) {
    if (re.test(text) && !filters.some((x) => x.column === f.column)) { filters.push({ column: f.column, op: 'contains', value: f.value, valueTo: null }); said.push(f.label); }
  }

  // Grouping: "group by X", "by X", "per X"
  const groupPart = /(?:group(?:ed)?\s+by|per|by)\s+([a-z ]+)/.exec(text)?.[1] ?? '';
  for (const [re, col] of GROUP_WORDS[grid]) if (re.test(groupPart)) { groupBy = col; break; }

  // Sorting
  if (/\b(biggest|largest|highest|most expensive|top)\b/.test(text)) sort.push({ column: 'amount', direction: 'desc' });
  else if (/\b(smallest|lowest|cheapest)\b/.test(text)) sort.push({ column: 'amount', direction: 'asc' });
  else if (/\boldest\b/.test(text)) sort.push({ column: 'at', direction: 'asc' });
  else if (/\b(newest|latest|recent)\b/.test(text)) sort.push({ column: 'at', direction: 'desc' });

  // Anything left that looks like a product word ("headphones only") becomes a quick search.
  const rest = text.replace(/\$?\d+(\.\d+)?/g, ' ').split(/[^a-z]+/).filter((w) => w.length > 3 && !STOP.has(w)
    && !VALUE_WORDS[grid].some(([re]) => re.test(w)) && !GROUP_WORDS[grid].some(([re]) => re.test(w)));
  const search = !groupBy && rest.length === 1 ? rest[0]! : null;
  if (search) said.push(`matching “${search}”`);

  if (!filters.length && !sort.length && !groupBy && !search) return null;
  const what = grid === 'orders' ? 'orders' : 'missed sales';
  const explanation = [
    `Showing ${what}${said.length ? ` ${said.join(', ')}` : ''}`,
    groupBy ? `, grouped by ${groupBy === 'paidVia' ? 'payment method' : groupBy}` : '',
    sort[0] ? `, ${sort[0].column === 'amount' ? (sort[0].direction === 'desc' ? 'biggest' : 'smallest') : sort[0].direction === 'desc' ? 'newest' : 'oldest'} first` : '',
    '.',
  ].join('');
  return { filters, sort, groupBy, search, explanation, model: 'built-in rules (AI busy)' };
}
