import { REASON_TEXT } from '@paypalvault/audit';
import { historyText, storesText } from '@paypalvault/agents';
import type { Channel3Insight } from '@paypalvault/policy';

// Alert emails (Step 12). Builds each email from the vault's own facts: the subject starts with the
// vault name and short id, so every vault's mail is easy to tell apart in the inbox. Pure functions
// (no database, no network), so every email can be tested. notify.ts gathers the facts and sends.

export type EmailKind =
  | 'VAULT_LIVE'
  | 'PURCHASED'
  | 'NEEDS_HUMAN'
  | 'OPTIONS_READY'
  | 'BLOCK'
  | 'POLICY_CHANGED'
  | 'REFUND_SENT'
  | 'LIQUIDATED'
  | 'ENDING_SOON'
  | 'PAYOUT_FAILED'
  | 'PAYPAL_MISMATCH'
  | 'SAVINGS_PAYMENT'
  | 'SAVINGS_GOAL_REACHED'
  | 'SAVINGS_PAYMENT_FAILED';

export type VaultFacts = {
  id: string;
  name: string;
  type: string; // SHOPPING | UTILITY
  ownerName: string;
  budgetCents: number;
  balanceCents: number;
  expiresAt: Date;
  lookingFor?: string; // shopping vaults: what the AI searches for
  maxPerPaymentCents?: number;
  shops?: string[];
  link: string; // opens this vault on the site
};

// `channel3`: the product data behind the pick (photo, stores compared, 90-day price), when it came from Channel3.
export type Purchase = { item: string; merchant: string; amountCents: number; productUrl?: string; channel3?: Channel3Insight };

/** A button that answers the email (Approve / Reject / Pick). The link opens a confirm page on the site. */
export type EmailAction = { label: string; url: string; style: 'primary' | 'secondary' };

export type EmailInput =
  | { kind: 'VAULT_LIVE'; vault: VaultFacts }
  | { kind: 'PURCHASED'; vault: VaultFacts; purchase: Purchase }
  | { kind: 'NEEDS_HUMAN' | 'BLOCK'; vault: VaultFacts; purchase: Purchase; reasons: string[]; actions?: EmailAction[] }
  | { kind: 'OPTIONS_READY'; vault: VaultFacts; options: Purchase[]; summary?: string; actions?: EmailAction[] }
  | {
      kind: 'POLICY_CHANGED';
      vault: VaultFacts;
      version: number;
      changes: { label: string; before: string; after: string }[];
      changeCents: number; // + charged from PayPal, - refunded to PayPal
      cancelledApprovals: number;
      refundFailed?: string;
    }
  | { kind: 'REFUND_SENT'; vault: VaultFacts; amountCents: number }
  | {
      kind: 'LIQUIDATED';
      vault: VaultFacts;
      refundCents: number;
      totals: { paidInCents: number; spentCents: number; refundedCents: number };
      purchases: Purchase[];
      ruleVersions: number;
      openedAt: Date;
    }
  | { kind: 'ENDING_SOON'; vault: VaultFacts }
  | { kind: 'PAYOUT_FAILED'; vault: VaultFacts; amountCents: number; to: string; refund: boolean; reason?: string }
  | { kind: 'PAYPAL_MISMATCH'; vault: VaultFacts; payment: string; amountCents: number; paypalSays: string; paypalRef?: string }
  | { kind: 'SAVINGS_PAYMENT'; vault: VaultFacts; amountCents: number; paymentNumber: number; paymentsTotal: number; nextAt?: Date }
  | { kind: 'SAVINGS_GOAL_REACHED'; vault: VaultFacts; willShop: boolean }
  | { kind: 'SAVINGS_PAYMENT_FAILED'; vault: VaultFacts; reason: string; failures: number; paused: boolean };

export type Email = { subject: string; text: string; html: string };

export const shortId = (vaultId: string) => vaultId.slice(-5).toUpperCase();
export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const when = (d: Date) =>
  d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: process.env.ALERT_TIMEZONE?.trim() || 'Asia/Kolkata' });
const reasonText = (codes: string[]) => codes.map((c) => REASON_TEXT[c] ?? c.toLowerCase().replace(/_/g, ' ')).join('; ');
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// What to do about a block, in one line (the reason codes are the Policy Engine's).
const FIX: Record<string, string> = {
  MAX_LIMIT_EXCEEDED: 'Raise "max per payment" in the vault rules if you want to allow it.',
  MERCHANT_NOT_APPROVED: 'Add the shop to the vault rules if you trust it.',
  CATEGORY_NOT_ALLOWED: 'Change the vault rules to allow this kind of product.',
  INSUFFICIENT_VAULT_BALANCE: 'Raise the vault amount to add money.',
  DAILY_LIMIT_REACHED: 'The agent tries again tomorrow.',
  PRICE_MISMATCH: 'Nothing to do: PayPalVault stopped a possible overcharge.',
};

type Body = {
  headline: string;
  intro: string;
  facts: [string, string][];
  outro?: string;
  button?: string;
  actions?: EmailAction[]; // answer from the email; the vault link then becomes a small text link
  tone?: 'good' | 'warn' | 'bad';
  image?: string; // product photo (Channel3)
};

/** What Channel3 says about the product, as email rows: price check, other stores, money saved. */
function channel3Facts(p: Purchase): [string, string][] {
  const c3 = p.channel3;
  if (!c3) return [];
  const price = p.amountCents / 100;
  const check = historyText(price, c3.history ?? null);
  const others = (c3.stores ?? []).filter((st) => !(st.merchant === p.merchant && Math.abs(st.price - price) < 0.01));
  return [
    ...(check ? [['Price check', `${check} · Channel3`] as [string, string]] : []),
    ...(others.length ? [['Other stores', storesText(others)] as [string, string]] : []),
    ...(c3.saved ? [['You save', `${usd(Math.round(c3.saved * 100))} vs the most expensive store`] as [string, string]] : []),
  ];
}

/** Builds one alert email. */
export function buildEmail(input: EmailInput): Email {
  const v = input.vault;
  const subject = (what: string) => `[${v.name} · #${shortId(v.id)}] ${what}`;
  const left: [string, string] = ['Left in vault', `${usd(v.balanceCents)} of ${usd(v.budgetCents)}`];
  const rules: [string, string][] = [
    ...(v.lookingFor ? [['AI looks for', v.lookingFor] as [string, string]] : []),
    ['Amount', usd(v.budgetCents)],
    ...(v.maxPerPaymentCents !== undefined ? [['Max per payment', usd(v.maxPerPaymentCents)] as [string, string]] : []),
    ...(v.shops?.length ? [['Allowed shops', v.shops.join(', ')] as [string, string]] : []),
    ['Ends', when(v.expiresAt)],
  ];

  let s: string;
  let b: Body;
  switch (input.kind) {
    case 'VAULT_LIVE':
      s = subject(`Your vault is live: ${usd(v.budgetCents)} locked until ${when(v.expiresAt)}`);
      b = {
        headline: 'Your vault is live',
        intro: `${usd(v.budgetCents)} is locked in "${v.name}". ${v.type === 'UTILITY' ? 'The bill-pay agent is checking your bills' : 'The AI agent has started searching'}, and it can only spend within these rules:`,
        facts: rules,
        outro: 'Anything not spent by the end date comes back to your PayPal automatically.',
        tone: 'good',
      };
      break;

    case 'PURCHASED': {
      const p = input.purchase;
      s = subject(`Bought ${p.item} for ${usd(p.amountCents)} at ${p.merchant}`);
      b = {
        headline: v.type === 'UTILITY' ? 'Bill paid' : 'Purchase made',
        intro: v.type === 'UTILITY' ? `Your vault paid ${p.merchant}.` : `Your AI agent bought something that matches your rules.`,
        facts: [['Item', p.item], ['Shop', p.merchant], ['Price', usd(p.amountCents)], ...channel3Facts(p), ...(p.productUrl ? [['Product page', p.productUrl] as [string, string]] : []), left],
        tone: 'good',
        image: p.channel3?.image ?? undefined,
      };
      break;
    }

    case 'NEEDS_HUMAN': {
      const p = input.purchase;
      s = subject(`Approve ${p.item}: ${usd(p.amountCents)} at ${p.merchant}?`);
      b = {
        headline: 'Your approval is needed',
        intro: `The agent wants to buy this, but your rules ask you first because ${reasonText(input.reasons)}.`,
        facts: [['Item', p.item], ['Shop', p.merchant], ['Price', usd(p.amountCents)], ...channel3Facts(p), ...(p.productUrl ? [['Product page', p.productUrl] as [string, string]] : []), left],
        image: p.channel3?.image ?? undefined,
        outro: input.actions?.length
          ? 'Answer right here: Approve asks for your password on the next page; Reject needs none. These buttons work once and expire in 24 hours.'
          : 'Nothing is paid until you approve it with your password.',
        button: 'Review and approve',
        actions: input.actions,
        tone: 'warn',
      };
      break;
    }

    case 'OPTIONS_READY': {
      const n = input.options.length;
      s = subject(`Pick one: ${n} option${n === 1 ? '' : 's'} ready`);
      b = {
        headline: 'Your options are ready',
        intro: `${input.summary ? `${input.summary} ` : ''}This vault is set to "Ask me", so nothing is bought until you pick one.`,
        facts: [...input.options.map((o, i) => {
          const check = o.channel3 ? historyText(o.amountCents / 100, o.channel3.history ?? null) : null;
          return [`Option ${i + 1}`, `${o.item} · ${usd(o.amountCents)} at ${o.merchant}${check ? ` · ${check}` : ''}`] as [string, string];
        }), left],
        outro: input.actions?.length
          ? 'Pick one right here (your password is asked on the next page), or open the vault to see the pros and cons first. These buttons work once and expire in 24 hours.'
          : 'Open the vault to see the pros and cons of each, then tap the one you want.',
        button: 'See the options',
        actions: input.actions,
        tone: 'warn',
      };
      break;
    }

    case 'BLOCK': {
      const p = input.purchase;
      const fix = input.reasons.map((c) => FIX[c]).find(Boolean);
      s = subject(`Blocked: ${p.item} for ${usd(p.amountCents)} at ${p.merchant}`);
      b = {
        headline: 'A purchase was blocked',
        intro: `PayPalVault stopped this payment because ${reasonText(input.reasons)}. No money moved.`,
        facts: [['Item', p.item], ['Shop', p.merchant], ['Price', usd(p.amountCents)], left],
        outro: fix ?? 'The agent keeps looking for something that fits your rules.',
        tone: 'bad',
      };
      break;
    }

    case 'POLICY_CHANGED': {
      const money = input.changeCents > 0 ? `+${usd(input.changeCents)} charged`
        : input.changeCents < 0 ? `${usd(-input.changeCents)} refund on its way` : '';
      s = subject(`Rules updated (version ${input.version})${money ? `: ${money}` : ''}`);
      const facts: [string, string][] = input.changes.map((c) => [c.label, `${c.before} → ${c.after}`]);
      if (input.changeCents > 0) facts.push(['Money', `${usd(input.changeCents)} taken from your PayPal`]);
      if (input.changeCents < 0) {
        facts.push(['Money', input.refundFailed
          ? `The ${usd(-input.changeCents)} refund failed (${input.refundFailed}); the money stays in the vault`
          : `${usd(-input.changeCents)} is being refunded to your PayPal`]);
      }
      if (input.cancelledApprovals) facts.push(['Cancelled', `${input.cancelledApprovals} purchase(s) that were waiting for your approval`]);
      facts.push(left);
      b = {
        headline: `Vault rules updated (version ${input.version})`,
        intro: input.changes.length ? 'You changed this vault. What changed:' : 'You confirmed this vault\'s rules again; nothing changed.',
        facts,
        outro: 'The agent now works with the new rules. Earlier versions stay in the vault\'s rules history.',
        tone: input.refundFailed ? 'bad' : 'good',
      };
      break;
    }

    case 'REFUND_SENT':
      s = subject(`${usd(input.amountCents)} refunded to your PayPal`);
      b = {
        headline: 'Refund arrived',
        intro: `You lowered this vault's amount, and the difference (${usd(input.amountCents)}) is back in your PayPal.`,
        facts: [left, ['Ends', when(v.expiresAt)]],
        tone: 'good',
      };
      break;

    case 'LIQUIDATED': {
      const t = input.totals;
      s = subject(`Vault closed: ${usd(input.refundCents)} refunded`);
      const bought = input.purchases.map((p) => `${p.item} (${usd(p.amountCents)}, ${p.merchant})`).join('; ');
      b = {
        headline: 'Vault closed',
        intro: `"${v.name}" is closed and the money left in it is back in your PayPal. Here is its summary:`,
        facts: [
          ['Open', `${when(input.openedAt)} → ${when(new Date())}`],
          ['Paid in', usd(t.paidInCents)],
          ['Spent', `${usd(t.spentCents)}${bought ? `: ${bought}` : ''}`],
          ['Refunded', usd(t.refundedCents)],
          ...(input.ruleVersions > 1 ? [['Rule changes', `${input.ruleVersions - 1}`] as [string, string]] : []),
        ],
        outro: 'You can still see everything about this vault under "Vault history".',
        tone: 'good',
      };
      break;
    }

    case 'ENDING_SOON':
      s = subject(`Ends in 24 hours: ${usd(v.balanceCents)} still unspent`);
      b = {
        headline: 'Your vault ends tomorrow',
        intro: `"${v.name}" ends ${when(v.expiresAt)}. ${v.balanceCents > 0 ? `If nothing is bought by then, the ${usd(v.balanceCents)} left comes back to your PayPal automatically.` : ''}`,
        facts: rules.concat([left]),
        outro: 'Want more time or different rules? Open the vault and change its rules.',
        tone: 'warn',
      };
      break;

    case 'SAVINGS_PAYMENT': {
      const saved: [string, string] = ['Saved so far', `${usd(v.balanceCents)} of ${usd(v.budgetCents)}`];
      s = subject(`Saved ${usd(input.amountCents)} (payment ${input.paymentNumber} of ${input.paymentsTotal})`);
      b = {
        headline: input.paymentNumber === 1 ? 'Your savings plan has started' : 'Savings payment made',
        intro: `${usd(input.amountCents)} was taken from your PayPal and added to "${v.name}".`,
        facts: [saved, ['Payments', `${input.paymentNumber} of ${input.paymentsTotal}`], ...(input.nextAt ? [['Next payment', when(input.nextAt)] as [string, string]] : [])],
        outro: 'You can pause the plan, or close the vault and get everything saved back, at any time.',
        tone: 'good',
      };
      break;
    }

    case 'SAVINGS_GOAL_REACHED':
      s = subject(`Goal reached: ${usd(v.budgetCents)} saved`);
      b = {
        headline: 'You reached your goal',
        intro: `"${v.name}" now holds the full ${usd(v.budgetCents)}. No more payments will be taken. ${input.willShop ? 'The AI agent starts shopping now, within your rules:' : 'The money stays in the vault until you close it or it ends.'}`,
        facts: input.willShop ? rules : [['Saved', usd(v.budgetCents)], ['Ends', when(v.expiresAt)]],
        tone: 'good',
      };
      break;

    case 'SAVINGS_PAYMENT_FAILED':
      s = subject(input.paused ? 'Savings plan paused: payment failed' : 'Savings payment failed: retrying tomorrow');
      b = {
        headline: input.paused ? 'Your savings plan is paused' : 'A savings payment failed',
        intro: `PayPalVault could not take this payment from your PayPal: ${input.reason} ${input.paused ? 'No more payments are taken until you resume the plan.' : 'It is tried again tomorrow.'}`,
        facts: [['Saved so far', `${usd(v.balanceCents)} of ${usd(v.budgetCents)}`], ['Failed tries in a row', String(input.failures)]],
        outro: 'The money already saved is safe in the vault.',
        button: input.paused ? 'Open the vault to resume' : undefined,
        tone: 'bad',
      };
      break;

    case 'PAYOUT_FAILED':
      s = subject(input.refund ? `Refund of ${usd(input.amountCents)} failed` : `Payment of ${usd(input.amountCents)} to ${input.to} failed`);
      b = {
        headline: input.refund ? 'A refund failed' : 'A payment failed',
        intro: `PayPal did not complete ${input.refund ? 'the refund to your PayPal' : `the payment to ${input.to}`}. The money is safe: it is back in the vault.`,
        facts: [['Amount', usd(input.amountCents)], ...(input.reason ? [['PayPal said', input.reason] as [string, string]] : []), left],
        outro: input.refund ? 'PayPalVault tries the refund again automatically.' : 'The agent can try again; open the vault to see what happened.',
        tone: 'bad',
      };
      break;

    case 'PAYPAL_MISMATCH':
      s = subject(`PayPal shows something different for ${input.payment}`);
      b = {
        headline: 'Please check this payment',
        intro: 'PayPalVault checks every vault payment against PayPal\'s own records. For this one, PayPal says something different from the vault.',
        facts: [
          ['Payment', input.payment],
          ['Amount', usd(input.amountCents)],
          ['PayPal says', input.paypalSays],
          ...(input.paypalRef ? [['PayPal reference', input.paypalRef] as [string, string]] : []),
          left,
        ],
        outro: 'Nothing was changed automatically. You can look the payment up in your PayPal account with the reference above.',
        button: 'Open the vault',
        tone: 'bad',
      };
      break;
  }

  return { subject: s, text: renderText(v, b), html: renderHtml(v, b) };
}

function renderText(v: VaultFacts, b: Body) {
  const width = Math.max(...b.facts.map(([k]) => k.length));
  return [
    `Hi ${v.ownerName},`,
    '',
    b.intro,
    '',
    ...b.facts.map(([k, val]) => `  ${k.padEnd(width)}  ${val}`),
    '',
    ...(b.outro ? [b.outro, ''] : []),
    ...(b.actions ?? []).map((a) => `${a.label}: ${a.url}`),
    ...(b.actions?.length ? [''] : []),
    `${b.actions?.length ? 'Open the vault' : b.button ?? 'Open the vault'}: ${v.link}`,
    '',
    `Vault "${v.name}" · #${shortId(v.id)}`,
    'PayPalVault',
  ].join('\n');
}

const TONE = { good: '#007934', warn: '#B7791F', bad: '#D9381E' };

function actionButton(a: EmailAction) {
  const look = a.style === 'primary'
    ? 'background:#0070BA;color:#FFFFFF;border:1px solid #0070BA'
    : 'background:#FFFFFF;color:#003087;border:1px solid #CBD2D6';
  return `<a href="${escape(a.url)}" style="display:inline-block;${look};text-decoration:none;font-weight:600;padding:11px 20px;border-radius:24px;font-size:14px;margin:0 8px 8px 0">${escape(a.label)}</a>`;
}

function renderHtml(v: VaultFacts, b: Body) {
  const color = TONE[b.tone ?? 'good'];
  const rows = b.facts
    .map(([k, val]) => {
      const shown = /^https?:\/\//.test(val) ? `<a href="${escape(val)}" style="color:#0070BA">${escape(val)}</a>` : escape(val);
      return `<tr><td style="padding:6px 16px 6px 0;color:#6C7378;white-space:nowrap;vertical-align:top">${escape(k)}</td><td style="padding:6px 0;color:#0C0C0D">${shown}</td></tr>`;
    })
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#F5F7FA;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#003087;padding:18px 24px;color:#FFFFFF">
  <div style="font-size:13px;opacity:.8">PayPalVault vault · #${shortId(v.id)}</div>
  <div style="font-size:20px;font-weight:700;margin-top:2px">${escape(v.name)}</div>
</td></tr>
<tr><td style="padding:24px">
  <div style="font-size:18px;font-weight:700;color:${color};margin-bottom:12px">${escape(b.headline)}</div>
  <p style="margin:0 0 16px;color:#0C0C0D;font-size:15px;line-height:1.5">Hi ${escape(v.ownerName)},<br>${escape(b.intro)}</p>
  ${b.image && /^https:\/\//.test(b.image) ? `<img src="${escape(b.image)}" alt="" width="140" style="display:block;width:140px;max-width:100%;height:auto;border-radius:8px;border:1px solid #E5E7EB;margin:0 0 16px">` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.4;margin-bottom:16px">${rows}</table>
  ${b.outro ? `<p style="margin:0 0 20px;color:#444749;font-size:14px;line-height:1.5">${escape(b.outro)}</p>` : ''}
  ${b.actions?.length
    ? `<div>${b.actions.map(actionButton).join('')}</div>
  <p style="margin:14px 0 0;font-size:13px"><a href="${escape(v.link)}" style="color:#0070BA">${escape(b.button ?? 'Open the vault')}</a></p>`
    : `<a href="${escape(v.link)}" style="display:inline-block;background:#0070BA;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:24px;font-size:14px">${escape(b.button ?? 'Open the vault')}</a>`}
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #E5E7EB;color:#6C7378;font-size:12px">You get this email because you own the vault "${escape(v.name)}" (#${shortId(v.id)}).</td></tr>
</table></td></tr></table></body></html>`;
}
