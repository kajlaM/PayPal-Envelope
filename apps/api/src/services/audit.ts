import { prisma } from '@paypalvault/db';
import { anomalyScore, auditEnabled, ensureAuditIndex, indexDecision, indexLedger } from '@paypalvault/audit';
import { SpendRequestSchema, type SpendRequest } from '@paypalvault/policy';
import { onEvent } from '../events.ts';

// Elastic audit log (Step 11). Every decision and ledger change that the API emits is written to
// Elastic in the background; the payment flow never waits for it or fails because of it.

export async function auditDecision(decisionId: string) {
  const d = await prisma.decision.findUniqueOrThrow({ where: { id: decisionId }, include: { vault: true } });
  const request = SpendRequestSchema.safeParse(d.requestJson);
  if (!request.success) return;
  await indexDecision({
    id: d.id,
    vaultId: d.vaultId,
    vaultName: d.vault.name,
    vaultType: d.vault.type,
    result: d.result,
    reasons: d.resolvedBy === 'REJECTED_BY_HUMAN' ? [...d.reasons, 'REJECTED_BY_HUMAN'] : d.reasons,
    resolvedBy: d.resolvedBy,
    request: request.data,
    createdAt: d.createdAt,
  });
}

export async function auditLedgerEntry(entryId: string) {
  const e = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { vault: true, merchant: true } });
  await indexLedger({
    id: e.id,
    vaultId: e.vaultId,
    vaultName: e.vault.name,
    vaultType: e.vault.type,
    type: e.type,
    status: e.status,
    amountCents: e.amountCents,
    merchant: e.merchant?.name ?? null,
    note: e.note,
    decisionId: e.decisionId,
    updatedAt: e.updatedAt,
  });
}

/** Creates the index if needed and starts writing every decision / ledger event to Elastic. */
export async function startAuditLog() {
  if (!auditEnabled()) {
    console.log('Audit log off (set ELASTIC_URL and ELASTIC_API_KEY to turn it on).');
    return;
  }
  if (await ensureAuditIndex()) console.log('Created the Elastic audit index.');
  onEvent((event, payload) => {
    const job =
      event === 'decision:created' && typeof payload.decisionId === 'string'
        ? auditDecision(payload.decisionId)
        : event === 'ledger:updated' && typeof payload.entryId === 'string'
          ? auditLedgerEntry(payload.entryId)
          : null;
    job?.catch((err) => console.error(`Audit write failed (${event}):`, (err as Error).message));
  });
}

/** Writes everything already in the database to Elastic (first setup, or after the index was deleted). */
export async function reindexAll() {
  const [decisions, entries] = await Promise.all([
    prisma.decision.findMany({ select: { id: true } }),
    prisma.ledgerEntry.findMany({ select: { id: true } }),
  ]);
  for (const d of decisions) await auditDecision(d.id);
  for (const e of entries) await auditLedgerEntry(e.id);
  return { decisions: decisions.length, ledgerEntries: entries.length };
}

/**
 * Anomaly score for the Policy Engine (UNUSUAL_SPEND). Gives up after 2 seconds, or if Elastic is
 * off or down, so a slow audit cluster never blocks a payment.
 */
export async function spendAnomaly(vaultId: string, request: SpendRequest): Promise<number | undefined> {
  if (!auditEnabled()) return undefined;
  const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, 2_000));
  const score = anomalyScore(vaultId, { amount: request.amount, merchant: request.merchant, category: request.category })
    .then((r) => r.score)
    .catch((err) => {
      console.error('Anomaly check failed:', (err as Error).message);
      return undefined;
    });
  return Promise.race([score, timeout]);
}
