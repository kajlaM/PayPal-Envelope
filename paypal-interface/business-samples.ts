// 50 sample transactions per business, so every dashboard feature has something to show in a demo.
// They are marked `sample: true`, shown with a "Sample" badge, never sent to PayPal or stored in the
// database, and switched off with BIZ_SAMPLE_DATA=0 in .env.
//
// The same 50 every run. Times are relative to when the server started, so "today", "yesterday" and the
// live scenarios always look current:
//   - Audio Store: a burst of AI-agent payments for one product at a wrong price in the last 10 minutes
//     (Stampede watch + Price drop fire), repeat buyers (Bought together has pairs), refunds, a dispute
//     hold, withdrawals, a pending and a failed payment.
//   - City Utility: bills paid by bill-pay agents and by customers directly, credits, withdrawals.
// AI-agent buyers are anonymous labels, as in the real data; other payers are made-up names on example.com.

import type { BusinessAccount } from './accounts.ts';

export const SAMPLES_ON = process.env.BIZ_SAMPLE_DATA?.trim() !== '0';
const ANCHOR = Math.floor(Date.now() / 60_000) * 60_000; // server start, to the minute
const SOURCE_AGENT = 'AI agent (PayPalVault)';

type Line = { name: string; quantity: number; amount: number };
export type SampleRow = {
  id: string; at: string; type: string; kind: 'sale' | 'refund' | 'fee' | 'transfer' | 'other';
  direction: 'in' | 'out' | 'none'; source: string; agent: boolean; paidVia: string; product: string;
  items: string[]; lines: Line[]; category: string; storefront: string; customer: string; payerEmail: string;
  amount: number; fee: number; net: number; currency: string; status: string; invoiceId: string;
  paypalRef: string; paypal: string; paypalNote: string; inReport: boolean; sample: true; relatedTo: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const paypalFee = (gross: number) => -round2(gross * 0.0349 + 0.49); // US standard rate for goods & services
const at = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return Math.min(d.getTime(), ANCHOR - 60_000); // never in the future
};
const minutesAgo = (m: number) => ANCHOR - m * 60_000;
const hoursAgo = (h: number) => ANCHOR - h * 3_600_000;

/** Small seeded generator: the same "random" amounts every run. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const PAYERS: [string, string][] = [
  ['Priya Sharma', 'priya.sharma@example.com'], ['Daniel Okafor', 'daniel.okafor@example.com'], ['Mei Lin', 'mei.lin@example.com'],
  ['Carlos Ruiz', 'carlos.ruiz@example.com'], ['Hannah Becker', 'hannah.becker@example.com'], ['Arjun Mehta', 'arjun.mehta@example.com'],
  ['Sofia Rossi', 'sofia.rossi@example.com'], ['Liam Walsh', 'liam.walsh@example.com'], ['Aisha Khan', 'aisha.khan@example.com'],
  ['Noah Fischer', 'noah.fischer@example.com'],
];
const AGENTS = ['Customer 4B1E07', 'Customer 9E2C31', 'Customer A07F58', 'Customer 3FD912', 'Customer C58A4D', 'Customer 71A6B0', 'Customer E2B395'];

function builder(biz: BusinessAccount) {
  const rows: SampleRow[] = [];
  let n = 0;
  const idOf = () => `SAMPLE${biz.username.slice(0, 2).toUpperCase()}${String(++n).padStart(4, '0')}X`;
  const base = (t: number) => ({
    id: idOf(), at: new Date(t).toISOString(), currency: 'USD', status: 'Completed', invoiceId: '', relatedTo: '',
    paypal: 'Confirmed', paypalNote: 'Sample transaction (demo data, not in PayPal)', inReport: true, sample: true as const,
    storefront: biz.name, category: '', payerEmail: '',
  });
  return {
    rows,
    /** A sale. `who` = an agent label or a payer index; lines = [name, price, qty?][]. */
    sale(t: number, who: string | number, source: string, lines: [string, number, number?][], extra: Partial<SampleRow> = {}) {
      const agent = typeof who === 'string';
      const ls = lines.map(([name, price, q = 1]) => ({ name, quantity: q, amount: round2(price * q) }));
      const gross = round2(ls.reduce((s, l) => s + l.amount, 0));
      const fee = source === 'PayPal Payouts' ? 0 : paypalFee(gross);
      const row: SampleRow = {
        ...base(t), type: source === 'PayPal Payouts' ? 'Payout received' : 'Payment received', kind: 'sale', direction: 'in',
        source: agent ? SOURCE_AGENT : source, agent, paidVia: source,
        product: ls.map((l) => (l.quantity > 1 ? `${l.quantity} × ${l.name}` : l.name)).join(', '),
        items: ls.map((l) => l.name), lines: ls,
        customer: agent ? (who as string) : PAYERS[who as number]![0], payerEmail: agent ? '' : PAYERS[who as number]![1],
        amount: gross, fee, net: round2(gross + fee), paypalRef: '', ...extra,
      };
      row.paypalRef = row.id;
      if (extra.status === 'Failed') Object.assign(row, { fee: 0, net: 0, kind: 'other', type: 'Payment failed', direction: 'none' });
      rows.push(row);
      return row;
    },
    /** Money out: refunds, dispute holds, withdrawals, fees. */
    out(t: number, type: string, kind: SampleRow['kind'], amount: number, extra: Partial<SampleRow> = {}) {
      const row: SampleRow = {
        ...base(t), type, kind, direction: 'out', source: kind === 'transfer' ? 'Bank' : 'PayPal', agent: false, paidVia: '',
        product: type, items: [], lines: [], customer: '', amount: -Math.abs(amount), fee: 0, net: -Math.abs(amount), paypalRef: '', ...extra,
      };
      row.paypalRef = row.id;
      rows.push(row);
      return row;
    },
  };
}

function audioStore(biz: BusinessAccount) {
  const b = builder(biz);
  const P = {
    xm5: ['Sony WH-1000XM5 headphones', 348], stand: ['Headphone stand', 24.99], airpods: ['AirPods Pro (2nd gen)', 249],
    tips: ['Silicone ear tips (3 pairs)', 12.99], jbl: ['JBL Flip 6 speaker', 129.95], sm58: ['Shure SM58 microphone', 99],
    xlr: ['XLR cable 6 m', 18.5], hd560: ['Sennheiser HD 560S', 169], usbc: ['Anker USB-C cable 2-pack', 15.99],
    qc: ['Bose QuietComfort Earbuds II', 279],
  } as const satisfies Record<string, readonly [string, number]>;
  const cat: Record<string, string> = {
    [P.xm5[0]]: 'Headphones', [P.stand[0]]: 'Accessories', [P.airpods[0]]: 'Earbuds', [P.tips[0]]: 'Accessories', [P.jbl[0]]: 'Speakers',
    [P.sm58[0]]: 'Pro audio', [P.xlr[0]]: 'Accessories', [P.hd560[0]]: 'Headphones', [P.usbc[0]]: 'Accessories', [P.qc[0]]: 'Earbuds',
  };
  const L = (p: readonly [string, number], q?: number): [string, number, number?] => [p[0], p[1], q];
  const sale = (t: number, who: string | number, source: string, lines: [string, number, number?][], extra: Partial<SampleRow> = {}) =>
    b.sale(t, who, source, lines, { category: cat[lines[0]![0]] ?? '', ...extra });
  const [A1, A2, A3, A4, A5, A6, A7] = AGENTS as [string, string, string, string, string, string, string];

  // AI-agent purchases over the last month (repeat buyers make "bought together" pairs)
  sale(at(28, 10, 15), A1, 'PayPal Checkout', [L(P.xm5)]);
  sale(at(27, 14, 40), A2, 'PayPal Payouts', [L(P.airpods)]);
  sale(at(27, 14, 52), A2, 'PayPal Payouts', [L(P.tips)]);
  sale(at(25, 9, 5), A3, 'PayPal Checkout', [L(P.jbl)]);
  sale(at(23, 19, 20), A4, 'PayPal Checkout', [L(P.airpods)]);
  sale(at(23, 19, 31), A4, 'PayPal Checkout', [L(P.tips)]);
  sale(at(21, 11, 11), A5, 'PayPal Payouts', [L(P.sm58)]);
  sale(at(21, 11, 18), A5, 'PayPal Payouts', [L(P.xlr)]);
  sale(at(18, 16, 45), A6, 'PayPal Checkout', [L(P.hd560)]);
  sale(at(16, 8, 30), A1, 'PayPal Checkout', [L(P.stand)]);
  sale(at(14, 13, 5), A7, 'PayPal Checkout', [L(P.qc)]);
  sale(at(12, 20, 10), A3, 'PayPal Payouts', [L(P.usbc)]);
  sale(at(9, 10, 0), A2, 'PayPal Checkout', [L(P.jbl)]);
  sale(at(6, 15, 25), A6, 'PayPal Checkout', [L(P.sm58)]);
  sale(at(3, 12, 12), A7, 'PayPal Payouts', [L(P.airpods)]);
  sale(at(1, 9, 40), A5, 'PayPal Checkout', [L(P.hd560)]);
  // The stampede: the speaker listed at $12.99 instead of $129.95, six agents buy it within 10 minutes.
  for (const [m, who] of [[9, A1], [7, A2], [6, A3], [4, A4], [3, A5], [1, A6]] as [number, string][]) {
    sale(minutesAgo(m), who, 'PayPal Checkout', [[P.jbl[0], 12.99]]);
  }

  // Everyone else: Checkout, invoices and PayPal payments
  sale(at(29, 12, 0), 0, 'PayPal Checkout', [L(P.xm5), L(P.stand)]);
  sale(at(26, 17, 30), 1, 'Invoice', [L(P.sm58), L(P.xlr, 2)], { invoiceId: 'INV2-SAMP-1001' });
  const mei = sale(at(24, 10, 20), 2, 'PayPal payment', [L(P.airpods)]);
  sale(at(22, 13, 45), 3, 'PayPal Checkout', [L(P.xm5)]);
  sale(at(20, 9, 10), 3, 'PayPal Checkout', [L(P.stand)]);
  const hannah = sale(at(19, 15, 0), 4, 'PayPal Checkout', [L(P.jbl)]);
  const arjun = sale(at(17, 11, 30), 5, 'Invoice', [L(P.hd560)], { invoiceId: 'INV2-SAMP-1002' });
  sale(at(15, 18, 5), 6, 'PayPal Checkout', [L(P.qc)]);
  const liam = sale(at(13, 14, 15), 7, 'PayPal payment', [L(P.usbc)]);
  sale(at(11, 10, 50), 8, 'PayPal Checkout', [L(P.airpods), L(P.tips)]);
  sale(at(10, 16, 20), 9, 'Invoice', [L(P.sm58)], { invoiceId: 'INV2-SAMP-1003' });
  sale(at(8, 12, 40), 0, 'PayPal payment', [L(P.tips, 2)]);
  sale(at(7, 19, 0), 2, 'PayPal Checkout', [L(P.jbl)]);
  sale(at(5, 9, 30), 1, 'PayPal Checkout', [L(P.stand)]);
  sale(at(4, 13, 10), 4, 'PayPal Checkout', [L(P.usbc, 3)]);
  sale(at(2, 11, 0), 5, 'PayPal Checkout', [L(P.qc)]);
  sale(at(1, 14, 30), 6, 'PayPal Checkout', [L(P.xm5)]);
  sale(at(1, 18, 45), 7, 'PayPal payment', [L(P.xlr)]);
  sale(hoursAgo(2), 8, 'PayPal Checkout', [L(P.hd560)]);
  sale(hoursAgo(1), 9, 'PayPal Checkout', [L(P.jbl)]);
  sale(minutesAgo(30), 0, 'PayPal Checkout', [L(P.sm58)], { status: 'Pending', paypalNote: 'Sample: eCheck still clearing (demo data)' });
  sale(at(12, 17, 25), 1, 'PayPal Checkout', [L(P.qc)], { status: 'Failed', paypalNote: 'Sample: card declined by the bank (demo data)' });

  // Money out
  b.out(at(16, 10, 0), 'Refund', 'refund', P.jbl[1], { customer: PAYERS[4]![0], payerEmail: PAYERS[4]![1], product: `Refund: ${P.jbl[0]}`, relatedTo: hannah.id });
  b.out(at(9, 15, 30), 'Refund', 'refund', P.usbc[1], { customer: PAYERS[7]![0], payerEmail: PAYERS[7]![1], product: `Refund: ${P.usbc[0]}`, relatedTo: liam.id });
  b.out(at(3, 11, 5), 'Refund', 'refund', 49, { customer: PAYERS[2]![0], payerEmail: PAYERS[2]![1], product: `Partial refund: ${P.airpods[0]}`, relatedTo: mei.id });
  b.out(at(10, 9, 0), 'Dispute hold', 'refund', P.hd560[1], { customer: PAYERS[5]![0], payerEmail: PAYERS[5]![1], product: `Dispute: ${P.hd560[0]} "not received"`, relatedTo: arjun.id, status: 'Pending' });
  b.out(at(20, 8, 0), 'Withdrawal to bank', 'transfer', 1500, { customer: 'Chase Business ••4421' });
  b.out(at(6, 8, 0), 'Withdrawal to bank', 'transfer', 900, { customer: 'Chase Business ••4421' });
  return b.rows;
}

function cityUtility(biz: BusinessAccount) {
  const b = builder(biz);
  const rand = seeded(biz.username);
  const BILLS: [string, number, number][] = [['Electricity bill', 45, 160], ['Water bill', 25, 70], ['Gas bill', 30, 110], ['Internet bill', 49.99, 79.99]];
  const bill = (i: number) => {
    const [name, lo, hi] = BILLS[i % BILLS.length]!;
    return [name, name === 'Internet bill' ? (rand() < 0.5 ? lo : hi) : round2(lo + rand() * (hi - lo))] as [string, number];
  };
  let inv = 2000;
  const sale = (t: number, who: string | number, i: number, extra: Partial<SampleRow> = {}) => {
    const [name, price] = bill(i);
    return b.sale(t, who, typeof who === 'string' ? 'PayPal Payouts' : 'Invoice', [[name, price]], { category: name.replace(' bill', ''), invoiceId: `INV2-SAMP-${++inv}`, ...extra });
  };
  // 24 bills paid by bill-pay agents, 20 paid by customers themselves, over two months
  for (let i = 0; i < 24; i++) sale(at(Math.floor(2 + i * 2.4), 6 + (i % 4), (i * 7) % 60), AGENTS[i % AGENTS.length]!, i);
  for (let i = 0; i < 20; i++) sale(at(Math.floor(1 + i * 2.8), 9 + (i % 9), (i * 11) % 60), i % PAYERS.length, i + 1);
  sale(hoursAgo(3), AGENTS[2]!, 0);
  sale(minutesAgo(40), 3, 1, { status: 'Pending', paypalNote: 'Sample: bank transfer still clearing (demo data)' });
  // Money out
  b.out(at(15, 10, 0), 'Refund', 'refund', 22.4, { customer: PAYERS[1]![0], payerEmail: PAYERS[1]![1], product: 'Credit: overcharged meter reading' });
  b.out(at(4, 10, 0), 'Refund', 'refund', 9.99, { customer: PAYERS[6]![0], payerEmail: PAYERS[6]![1], product: 'Credit: outage compensation' });
  b.out(at(30, 7, 0), 'Withdrawal to bank', 'transfer', 2500, { customer: 'Wells Fargo ••1180' });
  b.out(at(9, 7, 0), 'Withdrawal to bank', 'transfer', 1800, { customer: 'Wells Fargo ••1180' });
  return b.rows.slice(0, 50);
}

const cache = new Map<string, SampleRow[]>();

/** The business's 50 sample transactions (empty when BIZ_SAMPLE_DATA=0). */
export function sampleTransactions(biz: BusinessAccount): SampleRow[] {
  if (!SAMPLES_ON) return [];
  if (!cache.has(biz.username)) cache.set(biz.username, biz.username === 'cityutility' ? cityUtility(biz) : audioStore(biz));
  return cache.get(biz.username)!;
}
