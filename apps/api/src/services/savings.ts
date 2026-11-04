import { completeFunding, failFunding, prisma, startFunding, type Vault } from '@kubepay/db';
import { captureOrder, chargeSavedPayPal, PayPalApiError } from '@kubepay/paypal';
import { addInterval, savingsSchedule } from '@kubepay/policy';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';
import { startWatching } from './agent-runs.ts';

// Paying into a vault over time (savings vaults, "save up, then buy"). Each payment is taken from the
// owner's saved PayPal account (Vault API payment token, no popup) and credited like any funding:
// a FUND entry per payment. The vault is SAVING until it holds its full amount, then ACTIVE (and a
// shopping vault's agent starts). A declined payment is retried the next day; after 3 declines in a
// row the plan pauses and the owner is told.

const MAX_FAILURES = 3;
const HOUR_MS = 3_600_000;
const RETRY_MS = 24 * HOUR_MS;

export type SavingsResult = { vaultId: string; action: string; paid?: boolean; status?: string };

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Takes the vault's next payment now (the first one, a scheduled one, or "pay now" from the owner). */
export async function chargeSavingsPayment(vaultId: string, now = new Date()): Promise<SavingsResult> {
  const vault = await prisma.vault.findUnique({ where: { id: vaultId }, include: { user: true } });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  if (vault.savingsPerPaymentCents === null || vault.savingsEvery === null) throw new HttpError(409, 'NOT_A_SAVINGS_VAULT');
  if (vault.status !== 'PENDING_FUNDING' && vault.status !== 'SAVING') {
    throw new HttpError(409, 'NOT_SAVING', { message: 'This vault is not being paid into any more.' });
  }
  if (vault.expiresAt <= now) throw new HttpError(409, 'VAULT_EXPIRED');
  const inFlight = await prisma.ledgerEntry.findFirst({ where: { vaultId, type: 'FUND', status: 'PENDING' } });
  if (inFlight) throw new HttpError(409, 'PAYMENT_IN_FLIGHT', { message: 'A payment into this vault is still being processed by PayPal.' });

  const link = await prisma.paypalLink.findUnique({ where: { email: vault.user.paypalEmail.toLowerCase() } });
  if (!link) return failed(vault, 'Your PayPal account is not linked to KubePay.', now, { pause: true });

  const paid = await prisma.ledgerEntry.count({ where: { vaultId, type: 'FUND', status: 'COMPLETED' } });
  const amountCents = Math.min(vault.savingsPerPaymentCents, vault.budgetCents - vault.balanceCents);
  const n = paid + 1;
  let order: Awaited<ReturnType<typeof chargeSavedPayPal>>;
  try {
    order = await chargeSavedPayPal({
      paymentTokenId: link.paymentTokenId,
      vaultId,
      amountCents,
      description: `KubePay savings: payment ${n} into ${vault.name}`,
      // One id per payment and attempt: a network retry returns the same order, never a second charge.
      requestId: `save-${vaultId}-${n}-${vault.chargeFailures}`,
    });
  } catch (err) {
    if (err instanceof PayPalApiError) return failed(vault, err.body?.message ?? err.body?.name ?? `PayPal answered ${err.status}`, now);
    // Network trouble: PayPal may or may not have the order. Try again in an hour with the same request id.
    await prisma.vault.update({ where: { id: vaultId }, data: { nextChargeAt: new Date(now.getTime() + HOUR_MS) } });
    throw err;
  }

  if (!(await prisma.ledgerEntry.findUnique({ where: { paypalRef: order.orderId } }))) {
    const entry = await startFunding(vaultId, amountCents, order.orderId);
    await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { note: `Savings payment ${n} (saved PayPal account)` } });
  }
  const captureStatus = order.status === 'COMPLETED'
    ? order.captureStatus
    : (await captureOrder(order.orderId, { requestId: `capture-save-${order.orderId}` })).captureStatus;

  if (captureStatus === 'DECLINED' || captureStatus === 'FAILED') {
    await failFunding(order.orderId, `capture ${captureStatus}`);
    return failed(vault, `PayPal declined the payment (${captureStatus}).`, now);
  }
  const entry = await prisma.ledgerEntry.findUniqueOrThrow({ where: { paypalRef: order.orderId } });
  if (captureStatus !== 'COMPLETED') {
    // PayPal is still processing it: the PAYMENT.CAPTURE.COMPLETED webhook credits it later.
    await prisma.vault.update({ where: { id: vaultId }, data: { nextChargeAt: vault.savingsPausedAt ? null : addInterval(now, vault.savingsEvery) } });
    emit('ledger:updated', { vaultId, entryId: entry.id });
    return { vaultId, action: `payment of ${usd(amountCents)} is pending at PayPal`, paid: false, status: vault.status };
  }

  const updated = await completeFunding(order.orderId);
  await prisma.vault.update({
    where: { id: vaultId },
    data: {
      chargeFailures: 0,
      nextChargeAt: updated.status === 'SAVING' && !vault.savingsPausedAt ? addInterval(now, vault.savingsEvery) : null,
    },
  });
  if (updated.status === 'ACTIVE') await startWatching(vaultId); // goal reached: a shopping vault starts shopping
  emit('vault:updated', { vaultId });
  emit('ledger:updated', { vaultId, entryId: entry.id });
  return {
    vaultId,
    action: updated.status === 'ACTIVE' ? `paid ${usd(amountCents)}: goal of ${usd(vault.budgetCents)} reached` : `paid ${usd(amountCents)} (payment ${n})`,
    paid: true,
    status: updated.status,
  };
}

/** A payment did not go through: retry tomorrow, or pause the plan after too many tries. */
async function failed(vault: Vault, reason: string, now: Date, opts: { pause?: boolean } = {}): Promise<SavingsResult> {
  // The very first payment is made while the owner watches: they see the error, nothing is retried.
  if (vault.status === 'PENDING_FUNDING') throw new HttpError(402, 'PAYMENT_FAILED', { message: reason });
  const failures = vault.chargeFailures + 1;
  const pause = opts.pause || failures >= MAX_FAILURES;
  await prisma.vault.update({
    where: { id: vault.id },
    data: {
      chargeFailures: failures,
      nextChargeAt: pause ? null : new Date(now.getTime() + RETRY_MS),
      savingsPausedAt: pause ? now : vault.savingsPausedAt,
    },
  });
  emit('savings:failed', { vaultId: vault.id, reason, failures, paused: pause });
  emit('vault:updated', { vaultId: vault.id });
  return { vaultId: vault.id, action: `payment failed (${reason})${pause ? ': plan paused' : ': retrying tomorrow'}`, paid: false, status: vault.status };
}

/** Takes every savings payment that is due. Called by the background tick (scheduler.ts). */
export async function chargeDueSavings(now = new Date()): Promise<SavingsResult[]> {
  const due = await prisma.vault.findMany({
    where: { status: 'SAVING', nextChargeAt: { lte: now }, savingsPausedAt: null, expiresAt: { gt: now } },
    select: { id: true },
    orderBy: { nextChargeAt: 'asc' },
    take: 20,
  });
  const results: SavingsResult[] = [];
  for (const { id } of due) {
    // Claim it, so a second server or cron does not charge the same payment.
    const claimed = await prisma.vault.updateMany({ where: { id, nextChargeAt: { lte: now } }, data: { nextChargeAt: null } });
    if (claimed.count === 0) continue;
    results.push(
      await chargeSavingsPayment(id, now).catch(async (err) => {
        const retry = await prisma.vault.findUnique({ where: { id }, select: { nextChargeAt: true } });
        if (!retry?.nextChargeAt) await prisma.vault.update({ where: { id }, data: { nextChargeAt: new Date(now.getTime() + HOUR_MS) } });
        return { vaultId: id, action: `error: ${(err as Error).message}`, paid: false };
      }),
    );
  }
  return results;
}

/** The owner pauses the plan: no payments until resumed. Money saved so far stays in the vault. */
export async function pauseSavings(vaultId: string) {
  const vault = await savingVault(vaultId);
  await prisma.vault.update({ where: { id: vault.id }, data: { savingsPausedAt: new Date(), nextChargeAt: null } });
  emit('vault:updated', { vaultId });
}

/** Resumes the plan: the next payment is due one interval after the last one (or now, if that has passed). */
export async function resumeSavings(vaultId: string, now = new Date()) {
  const vault = await savingVault(vaultId);
  const last = await prisma.ledgerEntry.findFirst({ where: { vaultId, type: 'FUND', status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } });
  const due = last ? addInterval(last.createdAt, vault.savingsEvery!) : now;
  await prisma.vault.update({
    where: { id: vault.id },
    data: { savingsPausedAt: null, chargeFailures: 0, nextChargeAt: due > now ? due : now },
  });
  emit('vault:updated', { vaultId });
}

/**
 * The owner moves the next payment (dragged in the vault calendar). The payments after it keep their
 * interval from the new date, so every remaining payment must still fall before the vault ends.
 */
export async function rescheduleSavings(vaultId: string, at: Date, now = new Date()) {
  const vault = await savingVault(vaultId);
  if (vault.savingsPausedAt) throw new HttpError(409, 'SAVINGS_PAUSED', { message: 'The plan is paused. Resume it first.' });
  if (!(at.getTime() > now.getTime() + 5 * 60_000)) throw new HttpError(400, 'DATE_IN_PAST', { message: 'Pick a time from now on.' });
  const remaining = Math.ceil((vault.budgetCents - vault.balanceCents) / vault.savingsPerPaymentCents!);
  const lastAt = addInterval(at, vault.savingsEvery!, Math.max(0, remaining - 1));
  if (lastAt >= vault.expiresAt) {
    throw new HttpError(409, 'PLAN_PAST_END', {
      message: `The last payment would be on ${lastAt.toDateString()}, after the vault ends. Move the vault's end date first.`,
    });
  }
  const updated = await prisma.vault.update({ where: { id: vault.id }, data: { nextChargeAt: at } });
  emit('vault:updated', { vaultId });
  return { nextChargeAt: updated.nextChargeAt, lastPaymentAt: lastAt };
}

async function savingVault(vaultId: string) {
  const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  if (vault.status !== 'SAVING' || vault.savingsEvery === null) throw new HttpError(409, 'NOT_SAVING', { message: 'This vault is not being paid into.' });
  return vault;
}

/** What the plan looks like now, for the vault view. */
export async function savingsSummary(vault: Vault) {
  if (vault.savingsPerPaymentCents === null || vault.savingsEvery === null) return null;
  const made = await prisma.ledgerEntry.count({ where: { vaultId: vault.id, type: 'FUND', status: 'COMPLETED' } });
  const { payments } = savingsSchedule(vault.budgetCents, { amount_per_payment: vault.savingsPerPaymentCents / 100, every: vault.savingsEvery }, vault.createdAt);
  return {
    perPaymentCents: vault.savingsPerPaymentCents,
    every: vault.savingsEvery,
    paymentsMade: made,
    paymentsTotal: Math.max(payments, made),
    savedCents: vault.status === 'SAVING' || vault.status === 'PENDING_FUNDING' ? vault.balanceCents : vault.budgetCents,
    nextChargeAt: vault.nextChargeAt,
    pausedAt: vault.savingsPausedAt,
    failures: vault.chargeFailures,
  };
}
