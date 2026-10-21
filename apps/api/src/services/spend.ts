import { failOutflow, prisma, reserveSpend } from '@kubepay/db';
import { PayPalApiError, sendPayout } from '@kubepay/paypal';
import { SpendRequestSchema, toCents } from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';

/**
 * Runs an approved decision: hold the money in the ledger, then pay the merchant with Payouts.
 * The ledger entry id is the Payouts idempotency key, so a retry can never pay twice.
 */
export async function executeSpend(decisionId: string) {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: decisionId } });
  const request = SpendRequestSchema.parse(decision.requestJson);
  const merchant = await prisma.merchant.findFirst({
    where: { name: { equals: request.merchant, mode: 'insensitive' }, approved: true },
  });
  if (!merchant) throw new HttpError(409, 'MERCHANT_NOT_REGISTERED');

  const amountCents = toCents(request.amount);
  const entry = await reserveSpend({
    vaultId: decision.vaultId,
    amountCents,
    merchantId: merchant.id,
    decisionId,
    note: request.reason,
  });
  emit('vault:updated', { vaultId: decision.vaultId });

  try {
    const payout = await sendPayout({
      ledgerEntryId: entry.id,
      receiverEmail: merchant.sandboxEmail,
      amountCents,
      note: `KubePay payment to ${merchant.name}: ${request.reason}`.slice(0, 1000),
    });
    const updated = await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paypalRef: payout.payoutBatchId } });
    emit('ledger:updated', { vaultId: decision.vaultId, entryId: entry.id });
    return { ledgerEntry: updated, payout };
  } catch (err) {
    // PayPal said no: give the money back. On a network error we keep it held,
    // because the payout may have gone through; the sweeper re-sends it safely (resumeStuckPayouts).
    if (err instanceof PayPalApiError) {
      await failOutflow(entry.id, `Payout rejected: ${err.body?.name ?? err.status}`);
      emit('vault:updated', { vaultId: decision.vaultId });
    }
    throw err;
  }
}
