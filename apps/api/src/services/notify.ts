import { prisma } from '@kubepay/db';
import { describeDecision, describeLedger } from '@kubepay/audit';
import { SpendRequestSchema } from '@kubepay/policy';
import { onEvent } from '../events.ts';

// Zapier alerts (Step 12). Blocked payments, payments waiting for a human, refunds of unused money,
// and failed payouts are POSTed to a "Webhooks by Zapier: Catch Hook" URL, which forwards them to
// Slack / Gmail. Sent in the background: a Zapier outage never slows or breaks a payment.

export type AlertEvent = 'BLOCK' | 'NEEDS_HUMAN' | 'LIQUIDATED' | 'PAYOUT_FAILED';

export type Alert = {
  event: AlertEvent;
  vault: { id: string; name: string; type: string; status: string };
  amount: number; // dollars
  merchant: string | null;
  reasons: string[];
  message: string;
  dashboard_link: string;
  timestamp: string;
};

const hookUrl = () => process.env.ZAPIER_HOOK_URL?.trim() || undefined;
const dashboardLink = (vaultId: string) =>
  `${(process.env.DASHBOARD_URL?.trim() || 'http://localhost:5173').replace(/\/$/, '')}/?vault=${vaultId}`;

// The same ledger change can be emitted twice (webhook + sync); alert once per entry and status.
const sent = new Set<string>();

export async function sendAlert(alert: Alert) {
  const url = hookUrl();
  if (!url) return;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(alert),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Zapier answered ${res.status}`);
}

export async function alertForDecision(decisionId: string) {
  const d = await prisma.decision.findUniqueOrThrow({ where: { id: decisionId }, include: { vault: true } });
  // Only the engine's own BLOCK / NEEDS_HUMAN; a human approving or rejecting needs no alert.
  if (d.result === 'APPROVE' || d.resolvedBy) return;
  const request = SpendRequestSchema.safeParse(d.requestJson);
  if (!request.success) return;
  const key = `decision:${d.id}:${d.result}`;
  if (sent.has(key)) return;
  sent.add(key);
  await sendAlert({
    event: d.result,
    vault: { id: d.vault.id, name: d.vault.name, type: d.vault.type, status: d.vault.status },
    amount: request.data.amount,
    merchant: request.data.merchant,
    reasons: d.reasons,
    message: describeDecision({
      id: d.id, vaultId: d.vaultId, vaultName: d.vault.name, vaultType: d.vault.type, result: d.result,
      reasons: d.reasons, resolvedBy: null, request: request.data, createdAt: d.createdAt,
    }),
    dashboard_link: dashboardLink(d.vaultId),
    timestamp: d.createdAt.toISOString(),
  });
}

export async function alertForLedgerEntry(entryId: string) {
  const e = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { vault: true, merchant: true } });
  const event: AlertEvent | null =
    e.type === 'LIQUIDATE' && e.status === 'COMPLETED' ? 'LIQUIDATED'
      : e.type !== 'FUND' && e.status === 'FAILED' ? 'PAYOUT_FAILED'
        : null;
  if (!event) return;
  const key = `ledger:${e.id}:${e.status}`;
  if (sent.has(key)) return;
  sent.add(key);
  await sendAlert({
    event,
    vault: { id: e.vault.id, name: e.vault.name, type: e.vault.type, status: e.vault.status },
    amount: e.amountCents / 100,
    merchant: e.merchant?.name ?? null,
    reasons: e.note ? [e.note] : [],
    message: describeLedger({
      id: e.id, vaultId: e.vaultId, vaultName: e.vault.name, vaultType: e.vault.type, type: e.type, status: e.status,
      amountCents: e.amountCents, merchant: e.merchant?.name ?? null, note: e.note, decisionId: e.decisionId, updatedAt: e.updatedAt,
    }),
    dashboard_link: dashboardLink(e.vaultId),
    timestamp: e.updatedAt.toISOString(),
  });
}

/** Starts sending alerts to Zapier for every matching decision / ledger event. */
export function startNotifications() {
  if (!hookUrl()) {
    console.log('Zapier alerts off (set ZAPIER_HOOK_URL to turn them on).');
    return;
  }
  onEvent((event, payload) => {
    const job =
      event === 'decision:created' && typeof payload.decisionId === 'string'
        ? alertForDecision(payload.decisionId)
        : event === 'ledger:updated' && typeof payload.entryId === 'string'
          ? alertForLedgerEntry(payload.entryId)
          : null;
    job?.catch((err) => console.error(`Zapier alert failed (${event}):`, (err as Error).message));
  });
}
