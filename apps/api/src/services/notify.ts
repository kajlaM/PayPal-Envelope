import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prisma } from '@paypalvault/db';
import {
  controlMode, PolicySchema, ProposalOptionSchema, savingsSchedule, signApprovalLink, SpendRequestSchema, type ApprovalAction, type Policy,
} from '@paypalvault/policy';
import { onEvent, type PayPalVaultEvent } from '../events.ts';
import { buildEmail, shortId, usd, type Email, type EmailAction, type EmailInput, type EmailKind, type Purchase, type VaultFacts } from './emails.ts';

// Alert emails (Step 12). Every important moment of a vault (live, purchase, approval needed, blocked,
// rules changed, refund, ending soon, closed, payment failed) becomes a personal email written here
// (emails.ts) and POSTed to a "Webhooks by Zapier: Catch Hook" URL; the Zap only delivers it
// (Gmail: To / CC / Subject / Body from the email_* fields). Sent in the background: a Zapier
// outage never slows or breaks a payment.
//
// Recipients (.env): the vault owner gets the mail (ALERT_RECIPIENTS maps their PayPal sandbox email to
// a real inbox), and every address in ALERT_CC gets a copy.

export type Alert = {
  event: EmailKind;
  vault: { id: string; name: string; type: string; status: string; short_id: string };
  amount: number; // dollars
  merchant: string | null;
  reasons: string[];
  message: string; // plain-text body (kept for Zaps made before the email_* fields)
  dashboard_link: string;
  timestamp: string;
  email_to: string;
  email_cc: string; // comma separated
  email_subject: string;
  email_text: string;
  email_html: string;
};

const hookUrl = () => process.env.ZAPIER_HOOK_URL?.trim() || undefined;
const list = (value?: string) => (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const siteBase = () => (process.env.SITE_URL?.trim() || `http://localhost:${process.env.INTERFACE_PORT ?? 3000}`).replace(/\/$/, '');

export const siteLink = (vaultId: string) => `${siteBase()}/?vault=${vaultId}`;

/**
 * Answer-from-email link (two-way alerts): opens a confirm page on the wallet site, which checks the
 * signature (INTERNAL_API_KEY, shared by the API and the site). Without the key: no buttons.
 */
function actionLink(action: ApprovalAction, label: string, style: EmailAction['style']): EmailAction | null {
  const secret = process.env.INTERNAL_API_KEY?.trim();
  if (!secret) return null;
  return { label, url: `${siteBase()}/email/act?t=${encodeURIComponent(signApprovalLink(action, secret))}`, style };
}
const present = <T,>(list: (T | null)[]) => list.filter((x): x is T => x !== null);

// Written by the site (paypal-interface/signups.ts): people who signed up share a demo customer's PayPal
// sandbox account; the one who logged in last gets that account's alerts at their own email.
const SIGNUP_RECIPIENTS = fileURLToPath(new URL('../../../../paypal-interface/data/alert-recipient.json', import.meta.url));

function signUpRecipient(ownerPaypalEmail: string, vaultId?: string): string | undefined {
  try {
    const map = JSON.parse(readFileSync(SIGNUP_RECIPIENTS, 'utf8')) as Record<string, { email?: string }>;
    // The sign-up who created this vault first (signups.ts setVaultRecipient), then whoever logged in last.
    return (vaultId && map[`vault:${vaultId}`]?.email?.trim()) || map[ownerPaypalEmail.toLowerCase()]?.email?.trim() || undefined;
  } catch {
    return undefined; // nobody signed up yet
  }
}

/** The vault owner's real inbox (To) and everyone else in ALERT_CC (CC). */
export function recipients(ownerPaypalEmail: string, vaultId?: string) {
  const map = Object.fromEntries(
    list(process.env.ALERT_RECIPIENTS).map((pair) => pair.split('=').map((s) => s.trim().toLowerCase()) as [string, string]),
  );
  const cc = list(process.env.ALERT_CC);
  const to = signUpRecipient(ownerPaypalEmail, vaultId) ?? map[ownerPaypalEmail.toLowerCase()] ?? cc[0] ?? '';
  return { to, cc: cc.filter((a) => a.toLowerCase() !== to.toLowerCase()) };
}

// The same event can arrive twice (webhook + sync); mail once per entry and status.
const sent = new Set<string>();
const once = (key: string) => (sent.has(key) ? false : (sent.add(key), true));

async function send(input: EmailInput, extra: { ownerEmail: string; status: string; amountCents?: number; merchant?: string | null; reasons?: string[] }) {
  const url = hookUrl();
  if (!url) return;
  const email: Email = buildEmail(input);
  const { to, cc } = recipients(extra.ownerEmail, input.vault.id);
  const v = input.vault;
  const alert: Alert = {
    event: input.kind,
    vault: { id: v.id, name: v.name, type: v.type, status: extra.status, short_id: shortId(v.id) },
    amount: (extra.amountCents ?? 0) / 100,
    merchant: extra.merchant ?? null,
    reasons: extra.reasons ?? [],
    message: email.text,
    dashboard_link: v.link,
    timestamp: new Date().toISOString(),
    email_to: to,
    email_cc: cc.join(', '),
    email_subject: email.subject,
    email_text: email.text,
    email_html: email.html,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(alert),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Zapier answered ${res.status}`);
}

// ---------- Facts about a vault ----------

async function loadVault(vaultId: string) {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { id: vaultId },
    include: { user: true, policies: { orderBy: { version: 'desc' } } },
  });
  const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
  return { vault, policy: policy.success ? policy.data : undefined };
}

function facts(vault: Awaited<ReturnType<typeof loadVault>>['vault'], policy: Policy | undefined): VaultFacts {
  return {
    id: vault.id,
    name: vault.name,
    type: vault.type,
    ownerName: vault.user.name,
    budgetCents: vault.budgetCents,
    balanceCents: vault.balanceCents,
    expiresAt: vault.expiresAt,
    lookingFor: policy?.shopping?.product_query,
    maxPerPaymentCents: policy ? Math.round(policy.rules.max_single_transaction * 100) : undefined,
    shops: policy?.rules.approved_merchants,
    link: siteLink(vault.id),
  };
}

function purchaseFrom(requestJson: unknown, fallbackMerchant: string, amountCents: number): Purchase {
  const r = SpendRequestSchema.safeParse(requestJson);
  return {
    item: (r.success && (r.data.reason || r.data.invoice_id)) || 'a purchase',
    merchant: r.success ? r.data.merchant : fallbackMerchant,
    amountCents: r.success ? Math.round(r.data.amount * 100) : amountCents,
    productUrl: r.success ? r.data.product_url : undefined,
    channel3: r.success ? r.data.channel3 : undefined,
  };
}

// ---------- One function per kind of event ----------

export async function alertForDecision(decisionId: string) {
  const d = await prisma.decision.findUniqueOrThrow({ where: { id: decisionId } });
  // Only the engine's own BLOCK / NEEDS_HUMAN; a human approving or rejecting needs no mail. A run
  // that started under old rules being stopped (POLICY_CHANGED) is expected, not news.
  if (d.result === 'APPROVE' || d.resolvedBy || d.reasons.includes('POLICY_CHANGED')) return;
  if (!once(`decision:${d.id}:${d.result}`)) return;
  const { vault, policy } = await loadVault(d.vaultId);
  const purchase = purchaseFrom(d.requestJson, '?', 0);
  const actions = d.result === 'NEEDS_HUMAN'
    ? present([
        actionLink({ a: 'approve', v: vault.id, d: d.id }, `Approve ${usd(purchase.amountCents)}`, 'primary'),
        actionLink({ a: 'reject', v: vault.id, d: d.id }, 'Reject', 'secondary'),
      ])
    : undefined;
  await send(
    { kind: d.result, vault: facts(vault, policy), purchase, reasons: d.reasons, actions },
    { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: purchase.amountCents, merchant: purchase.merchant, reasons: d.reasons },
  );
}

export async function alertForProposal(proposalId: string) {
  const p = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (p.status !== 'OPEN' || !once(`proposal:${p.id}`)) return;
  const { vault, policy } = await loadVault(p.vaultId);
  const options = ProposalOptionSchema.array().parse(p.options).map((o) => ({
    item: o.title, merchant: o.merchant, amountCents: Math.round((o.verified_price ?? o.price) * 100), productUrl: o.url, channel3: o.channel3,
  }));
  const actions = present([
    ...options.map((o, i) => actionLink({ a: 'pick', v: vault.id, p: p.id, i }, `Pick ${i + 1}: ${usd(o.amountCents)} at ${o.merchant}`, 'primary')),
    actionLink({ a: 'none', v: vault.id, p: p.id }, 'None of these', 'secondary'),
  ]);
  await send(
    { kind: 'OPTIONS_READY', vault: facts(vault, policy), options, summary: p.summary ?? undefined, actions },
    { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: options[0]?.amountCents },
  );
}

export async function alertForSavingsFailure(payload: { vaultId: string; reason: string; failures: number; paused: boolean }) {
  if (!once(`savings-failed:${payload.vaultId}:${payload.failures}`)) return;
  const { vault, policy } = await loadVault(payload.vaultId);
  await send(
    { kind: 'SAVINGS_PAYMENT_FAILED', vault: facts(vault, policy), reason: payload.reason, failures: payload.failures, paused: payload.paused },
    { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: vault.savingsPerPaymentCents ?? 0, reasons: [payload.reason] },
  );
}

export async function alertForLedgerEntry(entryId: string) {
  const e = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { merchant: true, decision: true } });
  if (!once(`ledger:${e.id}:${e.status}`)) return;
  const { vault, policy } = await loadVault(e.vaultId);
  const v = facts(vault, policy);
  const base = { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: e.amountCents, merchant: e.merchant?.name ?? null };

  if (e.type === 'FUND' && e.status === 'COMPLETED' && vault.savingsPerPaymentCents !== null && vault.savingsEvery !== null) {
    // Paid in over time: one mail per payment, and one when the goal is reached.
    const paid = await prisma.ledgerEntry.findMany({ where: { vaultId: e.vaultId, type: 'FUND', status: 'COMPLETED' }, orderBy: { createdAt: 'asc' } });
    const n = paid.findIndex((p) => p.id === e.id) + 1;
    const { payments } = savingsSchedule(vault.budgetCents, { amount_per_payment: vault.savingsPerPaymentCents / 100, every: vault.savingsEvery }, vault.createdAt);
    if (vault.status !== 'SAVING' && n === paid.length) {
      await send({ kind: 'SAVINGS_GOAL_REACHED', vault: v, willShop: vault.type !== 'SAVINGS' }, base);
    } else {
      await send({ kind: 'SAVINGS_PAYMENT', vault: v, amountCents: e.amountCents, paymentNumber: n, paymentsTotal: Math.max(payments, n), nextAt: vault.nextChargeAt ?? undefined }, base);
    }
  } else if (e.type === 'FUND' && e.status === 'COMPLETED') {
    // The first payment makes the vault live. Later ones (top-ups) are in the "rules updated" mail.
    const first = await prisma.ledgerEntry.findFirst({ where: { vaultId: e.vaultId, type: 'FUND', status: 'COMPLETED' }, orderBy: { createdAt: 'asc' } });
    if (first?.id === e.id) await send({ kind: 'VAULT_LIVE', vault: v }, base);
  } else if (e.type === 'SPEND' && e.status === 'COMPLETED') {
    await send({ kind: 'PURCHASED', vault: v, purchase: purchaseFrom(e.decision?.requestJson, e.merchant?.name ?? 'merchant', e.amountCents) }, base);
  } else if (e.type === 'LIQUIDATE' && e.status === 'COMPLETED' && vault.status === 'LIQUIDATED') {
    await send({ kind: 'LIQUIDATED', vault: v, ...(await closingSummary(vault.id)), refundCents: e.amountCents, ruleVersions: vault.policies.length, openedAt: vault.createdAt }, base);
  } else if (e.type === 'LIQUIDATE' && e.status === 'COMPLETED') {
    await send({ kind: 'REFUND_SENT', vault: v, amountCents: e.amountCents }, base); // after lowering the amount
  } else if (e.status === 'FAILED' && e.type !== 'FUND') {
    await send(
      { kind: 'PAYOUT_FAILED', vault: v, amountCents: e.amountCents, to: e.merchant?.name ?? 'your PayPal', refund: e.type === 'LIQUIDATE', reason: e.note ?? undefined },
      { ...base, reasons: e.note ? [e.note] : [] },
    );
  }
}

async function closingSummary(vaultId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { vaultId, status: 'COMPLETED' },
    include: { merchant: true, decision: true },
    orderBy: { createdAt: 'asc' },
  });
  const sum = (type: string) => entries.filter((e) => e.type === type).reduce((n, e) => n + e.amountCents, 0);
  return {
    totals: { paidInCents: sum('FUND'), spentCents: sum('SPEND'), refundedCents: sum('LIQUIDATE') },
    purchases: entries
      .filter((e) => e.type === 'SPEND')
      .map((e) => purchaseFrom(e.decision?.requestJson, e.merchant?.name ?? 'merchant', e.amountCents)),
  };
}

function controlText(p: Policy) {
  const mode = controlMode(p);
  if (mode === 'ASK_ME') return 'Ask me (I pick from the top 3)';
  if (mode === 'AUTOPILOT') return 'Autopilot (buys within the rules)';
  const above = p.rules.human_approval_above;
  return above === undefined ? 'Buys within the rules' : `Ask me above ${usd(Math.round(above * 100))}`;
}

/** The rules as [label, text], to show what changed between two versions. */
function ruleRows(p: Policy): [string, string][] {
  const r = p.rules;
  return [
    ['Vault name', p.vault_name],
    ...(p.shopping ? [['AI looks for', p.shopping.product_query] as [string, string]] : []),
    ['Amount', usd(Math.round(p.allocated_budget * 100))],
    ['Max per payment', usd(Math.round(r.max_single_transaction * 100))],
    ['Allowed shops', r.approved_merchants.join(', ')],
    ['Categories', r.allowed_categories.join(', ')],
    ['Ends', new Date(r.expiry_timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: process.env.ALERT_TIMEZONE?.trim() || 'Asia/Kolkata' })],
    ['Control', controlText(p)],
  ];
}

export function policyChanges(before: Policy | undefined, after: Policy | undefined) {
  if (!before || !after) return [];
  const old = Object.fromEntries(ruleRows(before));
  return ruleRows(after)
    .filter(([label, value]) => old[label] !== value)
    .map(([label, value]) => ({ label, before: old[label] ?? '–', after: value }));
}

export async function alertForPolicyChange(payload: { vaultId: string; version: number; changeCents: number; cancelledApprovals: number; refundError?: string }) {
  if (!once(`policy:${payload.vaultId}:${payload.version}`)) return;
  const { vault, policy } = await loadVault(payload.vaultId);
  const now = vault.policies.find((p) => p.version === payload.version);
  const before = vault.policies.find((p) => p.version === payload.version - 1);
  const parse = (json: unknown) => { const r = PolicySchema.safeParse(json); return r.success ? r.data : undefined; };
  await send(
    {
      kind: 'POLICY_CHANGED',
      vault: facts(vault, policy),
      version: payload.version,
      changes: policyChanges(parse(before?.policyJson), parse(now?.policyJson)),
      changeCents: payload.changeCents,
      cancelledApprovals: payload.cancelledApprovals,
      refundFailed: payload.refundError,
    },
    { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: Math.abs(payload.changeCents) },
  );
}

// "Ends in 24 hours": mailed when a vault crosses the 24-hour mark between two checks, so a restart
// never mails the same vault twice (a vault that crossed it while the API was down gets none).
const DAY_MS = 24 * 60 * 60_000;
let lastEndingCheck = new Date();

export async function alertEndingSoon(now = new Date()) {
  const from = lastEndingCheck;
  lastEndingCheck = now;
  const vaults = await prisma.vault.findMany({
    where: { status: 'ACTIVE', expiresAt: { gt: new Date(from.getTime() + DAY_MS), lte: new Date(now.getTime() + DAY_MS) } },
    include: { user: true, policies: { orderBy: { version: 'desc' }, take: 1 } },
  });
  for (const vault of vaults) {
    if (vault.createdAt.getTime() > vault.expiresAt.getTime() - DAY_MS) continue; // lived less than a day
    if (!once(`ending:${vault.id}:${vault.expiresAt.toISOString()}`)) continue;
    const policy = PolicySchema.safeParse(vault.policies[0]?.policyJson);
    await send(
      { kind: 'ENDING_SOON', vault: facts(vault, policy.success ? policy.data : undefined) },
      { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: vault.balanceCents },
    ).catch((err) => console.error(`Ending-soon mail for vault ${vault.id} failed:`, (err as Error).message));
  }
}

/** "Verified by PayPal" found a difference: tell the vault owner (once per difference). */
export async function alertForMismatch(payload: { vaultId: string; entryId?: unknown; note?: unknown }) {
  if (typeof payload.entryId !== 'string' || typeof payload.note !== 'string') return;
  if (!once(`mismatch:${payload.entryId}:${payload.note}`)) return;
  const e = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: payload.entryId }, include: { merchant: true } });
  const { vault, policy } = await loadVault(e.vaultId);
  const payment = e.type === 'FUND' ? `${usd(e.amountCents)} added to the vault`
    : e.type === 'LIQUIDATE' ? `${usd(e.amountCents)} refunded to your PayPal`
      : `${usd(e.amountCents)} paid to ${e.merchant?.name ?? 'a shop'}`;
  await send(
    { kind: 'PAYPAL_MISMATCH', vault: facts(vault, policy), payment, amountCents: e.amountCents, paypalSays: payload.note, paypalRef: e.paypalTxnId ?? e.paypalRef ?? undefined },
    { ownerEmail: vault.user.paypalEmail, status: vault.status, amountCents: e.amountCents, merchant: e.merchant?.name ?? null, reasons: [payload.note] },
  );
}

/** Starts sending alert emails (through Zapier) for every matching event. */
export function startNotifications() {
  if (!hookUrl()) {
    console.log('Alert emails off (set ZAPIER_HOOK_URL to turn them on).');
    return;
  }
  if (!list(process.env.ALERT_CC).length && !list(process.env.ALERT_RECIPIENTS).length) {
    console.log('Alert emails: no ALERT_RECIPIENTS / ALERT_CC in .env, so the Zap decides where mail goes.');
  }
  onEvent((event: PayPalVaultEvent, payload) => {
    const job =
      event === 'decision:created' && typeof payload.decisionId === 'string' ? alertForDecision(payload.decisionId)
        : event === 'ledger:updated' && typeof payload.entryId === 'string' ? alertForLedgerEntry(payload.entryId)
          : event === 'policy:changed' ? alertForPolicyChange(payload as Parameters<typeof alertForPolicyChange>[0])
            : event === 'proposal:created' && typeof payload.proposalId === 'string' ? alertForProposal(payload.proposalId)
              : event === 'savings:failed' ? alertForSavingsFailure(payload as Parameters<typeof alertForSavingsFailure>[0])
              : event === 'verify:mismatch' ? alertForMismatch(payload)
            : null;
    job?.catch((err) => console.error(`Alert email failed (${event}):`, (err as Error).message));
  });
  setInterval(() => {
    alertEndingSoon().catch((err) => console.error('Ending-soon check failed:', (err as Error).message));
  }, 60_000).unref();
}
