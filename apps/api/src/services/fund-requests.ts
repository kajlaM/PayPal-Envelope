import { addFunding, prisma } from '@paypalvault/db';
import type { FundRequest } from '@paypalvault/db';
import { cancelMoneyRequest, getMoneyRequest, isRequestClosed, isRequestPaid, PayPalApiError, requestMoney } from '@paypalvault/paypal';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';
import { startWatching } from './agent-runs.ts';

// "Ask a friend" funding. The owner asks a friend to fund a vault that is waiting for money:
// PayPalVault sends a PayPal money request (Invoicing API, from the platform account) to the friend's
// PayPal email. When the friend pays it, the money is credited straight to the vault.
// The result arrives by webhook (INVOICING.INVOICE.PAID), by the background tick, or by "Check now";
// every path goes through settle(), which is safe to run twice.

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createFundRequest(vaultId: string, input: { payerEmail: string; message?: string; requesterName?: string }) {
  const vault = await prisma.vault.findUnique({ where: { id: vaultId }, include: { user: true } });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  if (vault.status !== 'PENDING_FUNDING') throw new HttpError(409, 'VAULT_ALREADY_FUNDED', { message: 'This vault already has its money.' });
  if (vault.savingsPerPaymentCents !== null) {
    throw new HttpError(409, 'SAVINGS_PAID_BY_OWNER', { message: 'Savings vaults are paid in by you over time.' });
  }
  const payerEmail = input.payerEmail.trim().toLowerCase();
  if (!EMAIL.test(payerEmail)) throw new HttpError(400, 'INVALID_EMAIL', { message: "Enter your friend's PayPal email." });
  if (payerEmail === vault.user.paypalEmail.toLowerCase()) {
    throw new HttpError(400, 'CANNOT_ASK_YOURSELF', { message: 'That is your own PayPal. Pick "Pay with PayPal" instead.' });
  }
  const open = await prisma.fundRequest.findFirst({ where: { vaultId, status: 'OPEN' } });
  if (open) throw new HttpError(409, 'REQUEST_ALREADY_OPEN', { message: `A request to ${open.payerEmail} is still open. Cancel it first.` });

  const amountCents = vault.budgetCents - vault.balanceCents;
  const who = input.requesterName?.trim() || vault.user.name;
  const message = input.message?.trim().slice(0, 500) || undefined;
  const note = [
    `${who} asked you to fund the PayPalVault vault "${vault.name}" (${dollars(amountCents)}).`,
    message ? `Message: "${message}"` : null,
    'Your payment goes straight into that vault. Anything it does not spend goes back to the vault owner when it closes.',
  ].filter(Boolean).join('\n');

  const request = await requestMoney({
    vaultId,
    payerEmail,
    amountCents,
    itemName: `Fund vault: ${vault.name}`,
    note,
  }).catch((err) => {
    if (err instanceof PayPalApiError) {
      const detail = err.body?.details?.[0];
      throw new HttpError(502, 'PAYPAL_REQUEST_FAILED', { message: `PayPal could not send the request: ${detail?.description ?? err.body?.message ?? err.message}` });
    }
    throw err;
  });

  const saved = await prisma.fundRequest.create({
    data: { vaultId, invoiceId: request.invoiceId, payerEmail, requesterName: who, message, amountCents, payUrl: request.payUrl },
  });
  emit('vault:updated', { vaultId });
  return saved;
}

/** Applies PayPal's state of the request: credits the vault if it is paid. Safe to run twice. */
async function settle(request: FundRequest): Promise<FundRequest> {
  if (request.status !== 'OPEN') return request;
  const remote = await getMoneyRequest(request.invoiceId);
  if (isRequestPaid(remote)) {
    const vault = await addFunding(
      request.vaultId,
      remote.paidCents || request.amountCents,
      request.invoiceId,
      `Paid by ${request.payerEmail} (PayPal money request)`,
    );
    const updated = await prisma.fundRequest.update({ where: { id: request.id }, data: { status: 'PAID', resolvedAt: new Date() } });
    if (vault.status === 'ACTIVE') await startWatching(vault.id); // shopping vaults: the agent starts now
    const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: request.invoiceId } });
    emit('vault:updated', { vaultId: request.vaultId });
    emit('ledger:updated', { vaultId: request.vaultId, entryId: entry?.id });
    return updated;
  }
  if (isRequestClosed(remote)) {
    const updated = await prisma.fundRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', resolvedAt: new Date() } });
    emit('vault:updated', { vaultId: request.vaultId });
    return updated;
  }
  if (remote.payUrl && remote.payUrl !== request.payUrl) {
    return prisma.fundRequest.update({ where: { id: request.id }, data: { payUrl: remote.payUrl } });
  }
  return request;
}

/** Checks open requests with PayPal (one vault, or all). Used by the tick and "Check now". */
export async function syncFundRequests(vaultId?: string) {
  const open = await prisma.fundRequest.findMany({ where: { status: 'OPEN', ...(vaultId ? { vaultId } : {}) } });
  const results: FundRequest[] = [];
  for (const r of open) {
    results.push(await settle(r).catch((err) => {
      console.error(`Fund request ${r.id}: check failed:`, (err as Error).message);
      return r;
    }));
  }
  return results;
}

/** Webhook INVOICING.INVOICE.PAID / CANCELLED on the platform app. Null if not one of ours. */
export async function onMoneyRequestEvent(invoiceId: string) {
  const request = await prisma.fundRequest.findUnique({ where: { invoiceId } });
  return request ? settle(request) : null;
}

/**
 * Cancels the request at PayPal so the friend can no longer pay it. If the friend paid in the
 * meantime, the vault is credited instead (and the result says PAID).
 */
export async function cancelFundRequest(request: FundRequest, note?: string): Promise<FundRequest> {
  const checked = await settle(request);
  if (checked.status !== 'OPEN') return checked;
  await cancelMoneyRequest(request.invoiceId, note).catch(async (err) => {
    // Already cancelled or paid at PayPal: settle() below picks that up.
    if (!(err instanceof PayPalApiError && err.status === 422)) throw err;
  });
  const after = await settle(checked);
  if (after.status !== 'OPEN') return after;
  const updated = await prisma.fundRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', resolvedAt: new Date() } });
  emit('vault:updated', { vaultId: request.vaultId });
  return updated;
}

/** Cancels every open request of a vault (it expired, or the owner paid another way). */
export async function cancelOpenFundRequests(vaultId: string, note?: string) {
  const open = await prisma.fundRequest.findMany({ where: { vaultId, status: 'OPEN' } });
  return Promise.all(open.map((r) => cancelFundRequest(r, note)));
}
