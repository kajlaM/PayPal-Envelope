import { failOutflow, LedgerError, prisma, reserveSpend, type Decision } from '@kubepay/db';
import { PayPalApiError, sendPayout } from '@kubepay/paypal';
import { evaluate, SpendRequestSchema, toCents, type Decision as Verdict, type Policy, type SpendRequest, type VaultSnapshot } from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';
import { payWithCheckout } from './checkout.ts';
import { buildEngineContext } from './policy-context.ts';

/**
 * Judges one spend request with the Policy Engine, records the decision and pays on APPROVE.
 * Used by the agents' spend route and when the owner picks one of the agent's options (Ask me).
 * `verdict` replaces the engine (e.g. a run that started under old rules is blocked).
 */
export async function decideAndSpend(
  vault: VaultSnapshot & { id: string },
  policy: Policy,
  request: SpendRequest,
  opts: { ownerChose?: boolean; verdict?: Verdict } = {},
) {
  const verdict = opts.verdict ?? evaluate(vault, policy, request, await buildEngineContext(vault, request), { ownerChose: opts.ownerChose });
  let decision: Decision = await prisma.decision.create({
    data: {
      vaultId: vault.id,
      requestJson: request,
      result: verdict.result,
      reasons: verdict.reasons,
      resolvedBy: opts.ownerChose && verdict.result === 'APPROVE' ? 'CHOSEN_BY_OWNER' : undefined,
    },
  });
  emit('decision:created', { vaultId: vault.id, decisionId: decision.id, result: decision.result });
  if (decision.result !== 'APPROVE') return { decision };

  try {
    return { decision, ...(await executeSpend(decision.id)) };
  } catch (err) {
    // Lost a race with another spend (e.g. balance just ran out): record it as a block.
    if (err instanceof LedgerError) {
      decision = await prisma.decision.update({ where: { id: decision.id }, data: { result: 'BLOCK', reasons: [err.code] } });
      emit('decision:created', { vaultId: vault.id, decisionId: decision.id, result: decision.result });
      return { decision };
    }
    // Failed before any money was held (e.g. database down): don't leave an APPROVE that never paid.
    const held = await prisma.ledgerEntry.findUnique({ where: { decisionId: decision.id } }).catch(() => null);
    if (!held) {
      await prisma.decision
        .update({ where: { id: decision.id }, data: { result: 'BLOCK', reasons: ['SYSTEM_ERROR'] } })
        .catch(() => undefined);
    }
    throw err;
  }
}

/**
 * Runs an approved decision: hold the money in the ledger, then pay the merchant. Shops are paid
 * with PayPal Checkout (a buyer-protected purchase from the platform's saved PayPal) when that is
 * set up, otherwise with Payouts. Utility bills stay on Payouts (their invoice is marked paid after).
 * The ledger entry id is the idempotency key either way, so a retry can never pay twice.
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
    itemId: request.item_id,
    note: request.reason,
  });
  emit('vault:updated', { vaultId: decision.vaultId });

  if (!request.invoice_id) {
    const checkout = await payWithCheckout(entry, merchant, request);
    if (checkout) {
      emit('ledger:updated', { vaultId: decision.vaultId, entryId: entry.id });
      return { ledgerEntry: checkout.ledgerEntry, payout: null, checkout: checkout.checkout };
    }
  }

  try {
    const payout = await sendPayout({
      ledgerEntryId: entry.id,
      receiverEmail: merchant.sandboxEmail,
      amountCents,
      note: `KubePay payment to ${merchant.name}: ${request.reason}`.slice(0, 1000),
    });
    const updated = await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paypalRef: payout.payoutBatchId, paidVia: 'PAYOUTS' } });
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
