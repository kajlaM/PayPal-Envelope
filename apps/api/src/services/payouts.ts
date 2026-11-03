import { failOutflow, prisma } from '@kubepay/db';
import { getPayout, PayPalApiError, sendPayout, type PayoutItemStatus } from '@kubepay/paypal';
import { emit } from '../events.ts';
import { onPayoutFailed, onPayoutSucceeded } from './settle.ts';

const FAILED: PayoutItemStatus[] = ['FAILED', 'RETURNED', 'BLOCKED', 'REFUNDED', 'REVERSED'];

// Purchases paid with PayPal Checkout are settled by checkout.ts, never here (and never re-sent as
// a payout). paidVia is empty on entries made before Checkout existed, so "not CHECKOUT" keeps them.
const NOT_CHECKOUT = { OR: [{ paidVia: null }, { paidVia: { not: 'CHECKOUT' } }] };

/**
 * Asks PayPal for the status of every PENDING payout and settles the ledger.
 * Webhooks (Step 9) do the same job; this is the fallback and works without a public URL.
 */
export async function syncPendingPayouts(vaultId?: string) {
  const pending = await prisma.ledgerEntry.findMany({
    where: { status: 'PENDING', type: { in: ['SPEND', 'LIQUIDATE'] }, paypalRef: { not: null }, ...NOT_CHECKOUT, ...(vaultId ? { vaultId } : {}) },
  });

  const results: { entryId: string; status: string }[] = [];
  for (const entry of pending) {
    const payout = await getPayout(entry.paypalRef!);
    const item = payout.items.find((i) => i.ledgerEntryId === entry.id);
    if (!item) continue;

    if (item.status === 'SUCCESS') await onPayoutSucceeded(entry.id, item.payoutItemId);
    else if (FAILED.includes(item.status)) await onPayoutFailed(entry.id, `Payout ${item.status}: ${item.error ?? ''}`.trim());
    results.push({ entryId: entry.id, status: item.status });
  }
  return results;
}

/**
 * Payouts that were sent but never got a batch id back (network error mid-call) would be skipped by
 * the sync forever. Re-sending is safe: the ledger entry id is the PayPal-Request-Id, so PayPal
 * returns the original batch instead of paying twice. Errors are only logged, never refunded here.
 */
export async function resumeStuckPayouts(olderThanMs = 2 * 60_000) {
  const stuck = await prisma.ledgerEntry.findMany({
    where: { status: 'PENDING', type: { in: ['SPEND', 'LIQUIDATE'] }, paypalRef: null, ...NOT_CHECKOUT, createdAt: { lt: new Date(Date.now() - olderThanMs) } },
    include: { merchant: true, vault: { include: { user: true } } },
  });
  for (const entry of stuck) {
    const receiverEmail = entry.type === 'SPEND' ? entry.merchant?.sandboxEmail : entry.vault.user.paypalEmail;
    if (!receiverEmail) continue;
    try {
      const payout = await sendPayout({ ledgerEntryId: entry.id, receiverEmail, amountCents: entry.amountCents, note: entry.note ?? 'KubePay payout' });
      await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paypalRef: payout.payoutBatchId } });
    } catch (err) {
      console.error(`Could not resume payout for ledger entry ${entry.id}:`, (err as Error).message);
    }
  }
  return stuck.length;
}

/** Pays a LIQUIDATE entry back to the vault owner. */
export async function payOutLiquidation(entryId: string) {
  const entry = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { vault: { include: { user: true } } } });
  try {
    const payout = await sendPayout({
      ledgerEntryId: entry.id,
      receiverEmail: entry.vault.user.paypalEmail,
      amountCents: entry.amountCents,
      note: `KubePay: unused balance returned from vault "${entry.vault.name}"`,
    });
    await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paypalRef: payout.payoutBatchId } });
    return payout;
  } catch (err) {
    // Same rule as spends: only release the money when PayPal clearly said no.
    if (err instanceof PayPalApiError) await failOutflow(entry.id, `Liquidation payout rejected: ${err.body?.name ?? err.status}`);
    throw err;
  } finally {
    emit('vault:updated', { vaultId: entry.vaultId });
  }
}
