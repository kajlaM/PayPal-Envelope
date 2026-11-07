// Seller side of agentic commerce: what a shop sees of the AI agents that buy from it.
//
// CONFIDENTIALITY RULE: a business only knows the payments it received, exactly as with any PayPal
// payment. It never learns what a customer wanted, their budget, their limits, their rules, what their
// agent looked at, or what it decided not to buy. Nothing here reads policies, blocked decisions or
// proposals, and nothing here talks to (or influences) any customer or shopping agent.
//
//   transactions() - every transaction on the business's PayPal account (business-transactions.ts), with
//                    the AI-agent payments recognised and tagged; agent buyers stay anonymous
//   orders()   - the AI-agent payments from PayPalVault's ledger (shown at once, before PayPal reports them)
//   together() - product pairs paid for by the same buyer (counts only, never who)
//   pulse()    - a fingerprint of this business's payments, so the page knows when to refresh
//   ask()      - plain English -> AG Grid filters / sort / grouping over the business's own payments
// Buyers are anonymised per business ("Customer 7F2A9C"); vault names, balances and owners never leave this file.

import { createHmac } from 'node:crypto';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@paypalvault/db';
import { policyModels } from '@paypalvault/policy';
import type { BusinessAccount } from './accounts.ts';
import { connection, paypalTransactions, transactionsVersion, type PayPalTxn } from './business-transactions.ts';
import { sampleTransactions } from './business-samples.ts';
import { notesOf } from './business-notes.ts';

const SECRET = process.env.INTERNAL_API_KEY?.trim() ?? '';

/** Same customer -> same label for one business, but not linkable across businesses. */
function customerLabel(biz: BusinessAccount, userId: string) {
  return `Customer ${createHmac('sha256', SECRET).update(`${biz.username}:${userId}`).digest('hex').slice(0, 6).toUpperCase()}`;
}

/**
 * This business's own shop: the registered merchant with the business's name (e.g. "Audio Store").
 * Only its own sales show, never another shop's. (In the sandbox, BestBuy / Target / Walmart are
 * stand-in merchants that happen to pay out to the same PayPal test account; they are not Audio Store.)
 */
export async function storefronts(biz: BusinessAccount) {
  return prisma.merchant.findMany({
    where: { name: { equals: biz.name, mode: 'insensitive' } },
    select: { id: true, name: true, category: true, sandboxEmail: true },
  });
}

/** Bill payments only say "bill": name them after the bill's category, e.g. "Electricity bill". */
const productName = (text: unknown, category: unknown) => {
  const name = String(text ?? '').trim();
  if (!name) return 'Payment'; // no description on the request: say nothing more than PayPal would
  if (/^(bill|bill payment)$/i.test(name)) return category ? `${category} bill` : 'Bill payment';
  return name;
};

const PAID_VIA: Record<string, string> = { CHECKOUT: 'PayPal Checkout', PAYOUTS: 'PayPal Payouts' };
const STATUS: Record<string, string> = { COMPLETED: 'Completed', PENDING: 'Pending', FAILED: 'Failed' };

// ---------- Orders: payments this business received ----------

export async function orders(biz: BusinessAccount) {
  return (await agentPayments(biz)).map(({ refs: _refs, ...row }) => row);
}

/** AI-agent payments from the ledger, with every id PayPal may know them by (for matching, server-only). */
async function agentPayments(biz: BusinessAccount) {
  const shops = await storefronts(biz);
  const entries = await prisma.ledgerEntry.findMany({
    where: { type: 'SPEND', merchantId: { in: shops.map((s) => s.id) } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, createdAt: true, amountCents: true, status: true, paidVia: true, note: true,
      paypalRef: true, paypalTxnId: true, paypalCheck: true, paypalCheckNote: true,
      merchant: { select: { name: true } },
      vault: { select: { userId: true } },
      // Only the item that was bought (what any shop sees on an order), never the customer's rules or reasons.
      decision: { select: { requestJson: true } },
    },
  });

  return entries.map((e) => {
    const req = (e.decision?.requestJson ?? {}) as Record<string, unknown>;
    const category = typeof req.category === 'string' ? req.category : '';
    // The item comes from the payment request's description: the item title (shopping agent) or
    // "Pay invoice …" (bill pay), the same text PayPal shows the business in the payout note. The ledger
    // note is internal: a failed payout overwrites it with the error ("Payout FAILED: …"), so it is only
    // a fallback for entries that did not fail.
    const described = typeof req.reason === 'string' ? req.reason : '';
    const fallback = e.status === 'FAILED' ? '' : e.note;
    return {
      id: e.id,
      at: e.createdAt.toISOString(),
      product: productName((described || fallback || '').slice(0, 120), category),
      category,
      storefront: e.merchant?.name ?? '',
      amount: e.amountCents / 100,
      paidVia: PAID_VIA[e.paidVia ?? ''] ?? 'PayPal Payouts',
      status: STATUS[e.status] ?? e.status,
      customer: customerLabel(biz, e.vault.userId),
      paypalRef: e.paypalTxnId ?? e.paypalRef ?? '',
      // "Verified by PayPal": the last read-only check of this payment against PayPal's own records.
      paypal: e.paypalCheck === 'VERIFIED' ? 'Confirmed' : e.paypalCheck === 'MISMATCH' ? 'Differs' : e.paypalCheck === 'WAITING' ? 'Processing' : 'Not checked',
      paypalNote: e.paypalCheck === 'VERIFIED' ? 'Confirmed in your PayPal account' : e.paypalCheckNote ?? 'Not checked against PayPal yet',
      refs: [e.id, e.paypalRef, e.paypalTxnId].filter((r): r is string => Boolean(r)),
    };
  });
}

// ---------- All transactions: the business's PayPal account + AI-agent payments recognised in it ----------

const SOURCE_AGENT = 'AI agent (PayPalVault)';
const MATCH_WINDOW_MS = 15 * 60_000;
const DISPLAY_STATUS: Record<PayPalTxn['status'], string> = { Completed: 'Completed', Pending: 'Pending', Reversed: 'Reversed', Denied: 'Failed', Other: 'Pending' };

export async function transactions(biz: BusinessAccount) {
  const [agent, paypal] = await Promise.all([agentPayments(biz), paypalTransactions(biz)]);
  const conn = await connection(biz);

  // 1. Match PayPal transactions to agent payments: by id (capture id, payout transaction, our custom id),
  //    then by same amount within 15 minutes for payouts PayPal reports under another id.
  const byRef = new Map<string, (typeof agent)[number]>();
  for (const a of agent) for (const r of a.refs) byRef.set(r, a);
  const matched = new Map<string, (typeof agent)[number]>(); // paypal txn id -> agent payment
  const used = new Set<string>();
  for (const t of paypal) {
    const a = [t.id, t.reference, t.custom].map((r) => r && byRef.get(r)).find(Boolean);
    if (a && !used.has(a.id)) { matched.set(t.id, a); used.add(a.id); }
  }
  for (const t of paypal) {
    if (matched.has(t.id) || t.kind !== 'sale') continue;
    const near = agent
      .filter((a) => !used.has(a.id) && Math.round(a.amount * 100) === Math.round(t.gross * 100) && Math.abs(Date.parse(a.at) - Date.parse(t.at)) <= MATCH_WINDOW_MS)
      .sort((x, y) => Math.abs(Date.parse(x.at) - Date.parse(t.at)) - Math.abs(Date.parse(y.at) - Date.parse(t.at)))[0];
    if (near) { matched.set(t.id, near); used.add(near.id); }
  }

  // 2. One row shape for the grid. Agent payments show the item and the anonymous buyer label, never
  //    anything about the customer; other transactions show the payer the way PayPal shows it.
  const rows = paypal.map((t) => {
    const a = matched.get(t.id);
    const itemText = t.items.map((i) => (i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name)).join(', ');
    return {
      id: t.id,
      at: t.at,
      type: t.type,
      kind: t.kind,
      direction: t.direction,
      source: a ? SOURCE_AGENT : t.source,
      agent: Boolean(a),
      paidVia: a ? a.paidVia : t.source,
      product: a ? a.product : itemText || t.subject || t.type,
      items: a ? [a.product] : t.items.map((i) => i.name),
      lines: a ? [{ name: a.product, quantity: 1, amount: t.gross }] : t.items.map((i) => ({ name: i.name, quantity: i.quantity, amount: i.amount ?? 0 })),
      category: a ? a.category : '',
      storefront: a ? a.storefront : '',
      customer: a ? a.customer : t.payerName || t.payerEmail || (t.direction === 'in' ? 'PayPal' : ''),
      payerEmail: a ? '' : t.payerEmail,
      amount: t.gross,
      fee: t.fee,
      net: t.net,
      currency: t.currency,
      status: DISPLAY_STATUS[t.status],
      invoiceId: t.invoiceId,
      paypalRef: t.id,
      paypal: 'Confirmed',
      paypalNote: 'In your PayPal transaction report',
      inReport: true,
      sample: false,
      relatedTo: '',
    };
  });
  // 3. Agent payments PayPal has not reported (yet): shown at once from the ledger.
  for (const a of agent) {
    if (used.has(a.id)) continue;
    rows.push({
      id: a.id, at: a.at, type: a.status === 'Failed' ? 'Payment failed' : 'Payment received', kind: a.status === 'Failed' ? 'other' : 'sale', direction: a.status === 'Failed' ? 'none' : 'in',
      source: SOURCE_AGENT, agent: true, paidVia: a.paidVia, product: a.product, items: [a.product],
      lines: [{ name: a.product, quantity: 1, amount: a.amount }], category: a.category,
      storefront: a.storefront, customer: a.customer, payerEmail: '', amount: a.amount, fee: null as unknown as number, net: null as unknown as number,
      currency: 'USD', status: a.status, invoiceId: '', paypalRef: a.paypalRef, paypal: a.paypal,
      paypalNote: conn.connected ? `Not in your PayPal transaction report yet (PayPal can take a few hours). ${a.paypalNote}` : a.paypalNote,
      inReport: false,
      sample: false,
      relatedTo: '',
    });
  }
  // 4. Demo sample transactions (BIZ_SAMPLE_DATA=0 turns them off), then the merchant's own notes.
  const samples = sampleTransactions(biz);
  rows.push(...samples);
  const notes = await notesOf(biz);
  for (const r of rows) Object.assign(r, { reconciled: false, tag: '', note: '', ...notes[r.id] });
  rows.sort((x, y) => (x.at < y.at ? 1 : -1));

  // The connected PayPal account should contain the agent payments. If none of the older ones are there,
  // the agents are paying a different PayPal account than the one connected: say so.
  const settled = agent.filter((a) => a.status === 'Completed' && Date.now() - Date.parse(a.at) > 6 * 3_600_000);
  // Name the account the agents pay when it is not the one this dashboard is connected to.
  const payTo = [...new Set((await storefronts(biz)).map((s) => s.sandboxEmail).filter(Boolean))];
  const elsewhere = payTo.filter((e) => e.toLowerCase() !== biz.sandboxEmail.toLowerCase());
  const warning = conn.connected && settled.length && !settled.some((a) => used.has(a.id))
    ? elsewhere.length
      ? `None of your ${settled.length} AI-agent payments are in the connected PayPal account (${biz.sandboxEmail}). Agents pay ${elsewhere.join(', ')}: connect that account's API credentials, or register ${biz.sandboxEmail} as ${biz.name}'s payout account, to see them in PayPal's records.`
      : `None of your ${settled.length} AI-agent payments are in the connected PayPal account. Agents pay the PayPal account registered for ${biz.name}; connect that account's API credentials to see them in PayPal's records.`
    : null;
  return { rows, connection: { ...conn, warning, agentInReport: settled.filter((a) => used.has(a.id)).length, agentPayments: agent.length, samples: samples.length } };
}

/**
 * A fingerprint of this business's payments (how many, last change). The page polls it to know when
 * to refresh, instead of listening to the platform's event stream, which carries every customer's
 * vault events and must never reach a business.
 */
export async function pulse(biz: BusinessAccount) {
  const shops = await storefronts(biz);
  const [agg, paypal] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { type: 'SPEND', merchantId: { in: shops.map((s) => s.id) } },
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    transactionsVersion(biz),
  ]);
  return { version: `${agg._count._all}:${agg._max.updatedAt?.getTime() ?? 0}:${paypal}` };
}

// ---------- Bought together: product pairs the same (anonymised) buyer paid for ----------
// Built only from payments this business received. The response holds counts, never customer labels,
// and a pair appears only once enough different buyers paid for both (so nobody can be singled out).

export const TOGETHER_MIN_BUYERS = 2;
export const TOGETHER_WINDOW_DAYS = 30;

export async function together(biz: BusinessAccount) {
  // Every sale on the business's PayPal account (agent or not), one entry per item in it.
  const sales = (await transactions(biz)).rows.filter((o) => o.kind === 'sale' && !['Failed', 'Reversed'].includes(o.status) && o.customer);
  const paid = sales.flatMap((o) => o.items.filter(Boolean).map((item) => ({
    at: o.at, product: item, category: o.category, customer: o.customer,
    amount: o.items.length === 1 ? o.amount : o.amount / o.items.length,
  })));
  const category = new Map<string, string>();
  const productBuyers = new Map<string, Set<string>>();
  const byBuyer = new Map<string, typeof paid>();
  for (const o of paid) {
    if (o.category && !category.has(o.product)) category.set(o.product, o.category);
    (productBuyers.get(o.product) ?? productBuyers.set(o.product, new Set()).get(o.product)!).add(o.customer);
    (byBuyer.get(o.customer) ?? byBuyer.set(o.customer, []).get(o.customer)!).push(o);
  }

  type Pair = { a: string; b: string; buyers: Set<string>; revenue: number; gaps: number[]; last: number };
  const pairs = new Map<string, Pair>();
  for (const [buyer, list] of byBuyer) {
    // One entry per product for this buyer: first time they paid for it, and everything they paid for it.
    const bought = new Map<string, { at: number; last: number; amount: number }>();
    for (const o of list) {
      const t = Date.parse(o.at);
      const b = bought.get(o.product);
      if (!b) bought.set(o.product, { at: t, last: t, amount: o.amount });
      else { b.at = Math.min(b.at, t); b.last = Math.max(b.last, t); b.amount += o.amount; }
    }
    const products = [...bought.keys()].sort();
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const A = bought.get(products[i]!)!;
        const B = bought.get(products[j]!)!;
        const gapDays = Math.abs(A.at - B.at) / 86_400_000;
        if (gapDays > TOGETHER_WINDOW_DAYS) continue;
        const key = `${products[i]}\u0000${products[j]}`;
        const p = pairs.get(key) ?? pairs.set(key, { a: products[i]!, b: products[j]!, buyers: new Set(), revenue: 0, gaps: [], last: 0 }).get(key)!;
        p.buyers.add(buyer);
        p.revenue += A.amount + B.amount;
        p.gaps.push(gapDays);
        p.last = Math.max(p.last, A.last, B.last);
      }
    }
  }

  const median = (list: number[]) => {
    const s = [...list].sort((x, y) => x - y);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
  };
  const rows = [...pairs.values()]
    .filter((p) => p.buyers.size >= TOGETHER_MIN_BUYERS)
    .map((p) => {
      // Lead = the product more buyers paid for; attach rate = how many of its buyers also paid for the other.
      const [lead, follow] = productBuyers.get(p.a)!.size >= productBuyers.get(p.b)!.size ? [p.a, p.b] : [p.b, p.a];
      return {
        id: `${lead}\u0000${follow}`,
        productA: lead,
        categoryA: category.get(lead) ?? '',
        productB: follow,
        categoryB: category.get(follow) ?? '',
        buyers: p.buyers.size,
        leadBuyers: productBuyers.get(lead)!.size,
        attachRate: p.buyers.size / productBuyers.get(lead)!.size,
        gapDays: Math.round(median(p.gaps) * 10) / 10,
        revenue: Math.round(p.revenue * 100) / 100,
        lastAt: new Date(p.last).toISOString(),
      };
    })
    .sort((x, y) => y.buyers - x.buyers || y.revenue - x.revenue);
  return { minBuyers: TOGETHER_MIN_BUYERS, windowDays: TOGETHER_WINDOW_DAYS, pairs: rows };
}

// ---------- Ask the grid in plain English (the business's own payments only) ----------

const GRID_COLUMNS = {
  at: 'date', type: 'text (Payment received, Payout received, Refund, Fee, Withdrawal to bank, Transfer...)',
  source: `text (${SOURCE_AGENT}, PayPal Checkout, PayPal Payouts, Invoice, Subscription, PayPal payment, Bank)`,
  product: 'text (item)', customer: 'text (payer)', category: 'text', amount: 'number (gross, negative = money out)',
  fee: 'number (negative)', net: 'number', status: 'text (Completed, Pending, Failed, Reversed)',
  paypal: 'text (Confirmed, Processing, Differs, Not checked)',
} as const;
export type GridName = 'orders';

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

const GROUPABLE = ['day', 'type', 'source', 'product', 'category', 'status', 'paypal', 'customer'];

/** Models that just said "out of quota" are skipped for a while instead of being retried on every question. */
const cooldown = new Map<string, number>();
const QUOTA_COOLDOWN_MS = 10 * 60_000;

export async function ask(_grid: GridName, text: string, now = new Date()): Promise<AskResult & { model: string }> {
  const system = [
    'You turn a business owner\'s request into settings for a data grid of every transaction on their PayPal business account (sales, AI-agent payments, refunds, fees, withdrawals).',
    `Columns (id: type): ${Object.entries(GRID_COLUMNS).map(([k, v]) => `${k}: ${v}`).join('; ')}.`,
    `Group-by options: ${GROUPABLE.join(', ')} ("day" groups by date).`,
    `Today is ${now.toISOString().slice(0, 10)} (${now.toLocaleDateString('en-US', { weekday: 'long' })}). "This week" starts on Monday. Dates are YYYY-MM-DD.`,
    'Number columns are US dollars. For dates use after/before/inRange. For text use contains/equals/notEqual.',
    'Use only the listed column ids. Prefer column filters over search. Keep everything empty/null that the request does not ask for.',
    '"Refunds" means type contains Refund. "Failed" means status Failed. "AI agents" / "agent payments" means source contains "AI agent". "Customer" or "payer" means the customer column. "Biggest" means amount descending.',
  ].join('\n');

  let lastError: unknown;
  for (const model of policyModels()) {
    if ((cooldown.get(model.modelId) ?? 0) > Date.now()) continue; // out of quota a moment ago: skip it for now
    try {
      const { object } = await generateObject({ model, schema: AskSchema, system, prompt: text, temperature: 0, maxRetries: 1 });
      const known = (c: string) => c in GRID_COLUMNS;
      return {
        filters: object.filters.filter((f) => known(f.column)),
        sort: object.sort.filter((s) => known(s.column)),
        groupBy: object.groupBy && GROUPABLE.includes(object.groupBy) ? object.groupBy : null,
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
  const quick = quickAsk('orders', text, now);
  if (quick) return quick;
  throw new Error(`The AI is busy right now and that request needs it. Try a simpler one (e.g. "over $40 this week") or again in a minute. (${(lastError as Error)?.message.slice(0, 80) ?? ''})`);
}

// ---------- Built-in fallback: plain-English rules, no AI ----------

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The words people use for each grouping / text value. */
const GROUP_WORDS: [RegExp, string][] = [
  [/\b(day|date|daily)\b/, 'day'], [/\btypes?\b/, 'type'], [/\b(source|channel|paid via|payment method|method)\b/, 'source'],
  [/\bproducts?|items?\b/, 'product'], [/\bcategor(y|ies)\b/, 'category'],
  [/\bstatus\b/, 'status'], [/\bpaypal check\b/, 'paypal'], [/\b(customers?|payers?|buyers?)\b/, 'customer'],
];
const VALUE_WORDS: [RegExp, { column: string; value: string; label: string }][] = [
  [/\b(ai|agents?|vault)\b/, { column: 'source', value: 'AI agent', label: 'from AI agents' }],
  [/\brefund(s|ed)?\b/, { column: 'type', value: 'Refund', label: 'that are refunds' }],
  [/\bfees?\b/, { column: 'type', value: 'Fee', label: 'that are fees' }],
  [/\bwithdraw(al|als|n)?\b/, { column: 'type', value: 'Withdrawal', label: 'that are withdrawals' }],
  [/\bfail(ed|ures?)?\b/, { column: 'status', value: 'Failed', label: 'that failed' }],
  [/\bpending\b/, { column: 'status', value: 'Pending', label: 'still pending' }],
  [/\bcheckout\b/, { column: 'source', value: 'Checkout', label: 'from PayPal Checkout' }],
  [/\binvoices?\b/, { column: 'source', value: 'Invoice', label: 'from invoices' }],
  [/\bpayouts?\b/, { column: 'source', value: 'Payouts', label: 'from PayPal Payouts' }],
  [/\b(confirmed|verified)\b/, { column: 'paypal', value: 'Confirmed', label: 'confirmed by PayPal' }],
  [/\b(differs|mismatch(ed)?)\b/, { column: 'paypal', value: 'Differs', label: 'that differ from PayPal\'s records' }],
];
const STOP = new Set('show me all only the a an of in on for with from to and or by my our your this that last week weeks month months today yesterday day days over under above below more less than between biggest largest highest smallest cheapest lowest newest latest oldest recent first group sort sorted orders order sales sale payments payment what which were was are is it them those items item please list find get see view top'.split(' '));

export function quickAsk(_grid: GridName, input: string, now = new Date()): (AskResult & { model: string }) | null {
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

  // Known values (status, payment method, PayPal check)
  for (const [re, f] of VALUE_WORDS) {
    if (re.test(text) && !filters.some((x) => x.column === f.column)) { filters.push({ column: f.column, op: 'contains', value: f.value, valueTo: null }); said.push(f.label); }
  }

  // Grouping: "group by X", "by X", "per X"
  const groupPart = /(?:group(?:ed)?\s+by|per|by)\s+([a-z ]+)/.exec(text)?.[1] ?? '';
  for (const [re, col] of GROUP_WORDS) if (re.test(groupPart)) { groupBy = col; break; }

  // Sorting
  if (/\b(biggest|largest|highest|most expensive|top)\b/.test(text)) sort.push({ column: 'amount', direction: 'desc' });
  else if (/\b(smallest|lowest|cheapest)\b/.test(text)) sort.push({ column: 'amount', direction: 'asc' });
  else if (/\boldest\b/.test(text)) sort.push({ column: 'at', direction: 'asc' });
  else if (/\b(newest|latest|recent)\b/.test(text)) sort.push({ column: 'at', direction: 'desc' });

  // Anything left that looks like a product word ("headphones only") becomes a quick search.
  const rest = text.replace(/\$?\d+(\.\d+)?/g, ' ').split(/[^a-z]+/).filter((w) => w.length > 3 && !STOP.has(w)
    && !VALUE_WORDS.some(([re]) => re.test(w)) && !GROUP_WORDS.some(([re]) => re.test(w)));
  const search = !groupBy && rest.length === 1 ? rest[0]! : null;
  if (search) said.push(`matching “${search}”`);

  if (!filters.length && !sort.length && !groupBy && !search) return null;
  const explanation = [
    `Showing transactions${said.length ? ` ${said.join(', ')}` : ''}`,
    groupBy ? `, grouped by ${groupBy === 'paypal' ? 'PayPal check' : groupBy === 'customer' ? 'payer' : groupBy}` : '',
    sort[0] ? `, ${sort[0].column === 'amount' ? (sort[0].direction === 'desc' ? 'biggest' : 'smallest') : sort[0].direction === 'desc' ? 'newest' : 'oldest'} first` : '',
    '.',
  ].join('');
  return { filters, sort, groupBy, search, explanation, model: 'built-in rules (AI busy)' };
}
