import { completeOutflow, failOutflow, prisma } from '@paypalvault/db';
import { recordInvoicePayment } from '@paypalvault/paypal';
import { SpendRequestSchema } from '@paypalvault/policy';
import { emit } from '../events.ts';

// One place that settles a payout result, used by the sync route now and by webhooks in Step 9.

export async function onPayoutSucceeded(entryId: string, payoutItemId?: string) {
  const changed = await completeOutflow(entryId);
  const entry = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { decision: true } });

  // Utility bill paid: mark the PayPal invoice as paid on the merchant side.
  if (changed && entry.type === 'SPEND' && entry.decision) {
    const request = SpendRequestSchema.safeParse(entry.decision.requestJson);
    if (request.success && request.data.invoice_id) {
      await recordInvoicePayment(request.data.invoice_id, entry.amountCents, payoutItemId ?? entry.paypalRef ?? entry.id)
        .catch((err) => console.error(`Could not mark invoice ${request.data.invoice_id} paid:`, (err as Error).message));
    }
  }
  emit('ledger:updated', { vaultId: entry.vaultId, entryId });
  emit('vault:updated', { vaultId: entry.vaultId });
  return changed;
}

export async function onPayoutFailed(entryId: string, reason: string) {
  const changed = await failOutflow(entryId, reason);
  const entry = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId } });
  emit('ledger:updated', { vaultId: entry.vaultId, entryId });
  emit('vault:updated', { vaultId: entry.vaultId });
  return changed;
}
