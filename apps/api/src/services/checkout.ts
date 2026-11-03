import { prisma, type LedgerEntry, type Merchant } from '@kubepay/db';
import { getCapture, payMerchantWithCheckout, PayPalApiError, type CheckoutPayment } from '@kubepay/paypal';
import { SpendRequestSchema, type SpendRequest } from '@kubepay/policy';
import { onPayoutFailed, onPayoutSucceeded } from './settle.ts';

// Vault purchases paid with PayPal Checkout. The vault still pays by itself (money in the KubePay
// platform account), but each purchase is a real PayPal purchase from the platform's saved PayPal
// account to the merchant: PayPal buyer protection, a receipt, and a normal refund button.
//
// Used when the platform account was saved once (`npm run setup:checkout -w apps/api`).
// Otherwise, and whenever PayPal clearly refuses a Checkout payment (nothing was paid), the shop is
// paid with Payouts exactly as before, so a purchase never fails because of Checkout.
// The entry is marked CHECKOUT *before* PayPal is called: if the call ends unclearly (network error),
// it is only ever retried as the same Checkout order, never also paid with Payouts.

/** The platform's saved PayPal (payment token), or null to pay with Payouts. */
export async function platformCheckoutToken(): Promise<string | null> {
  if (process.env.MERCHANT_PAYMENTS?.trim().toLowerCase() === 'payouts') return null; // switched off
  const email = process.env.PLATFORM_SANDBOX_EMAIL?.trim().toLowerCase();
  if (!email) return null;
  return (await prisma.paypalLink.findUnique({ where: { email } }))?.paymentTokenId ?? null;
}

// PayPal says this order was already paid (the PayPal-Request-Id expired before a retry): paying
// again by Payouts could pay twice, so this one waits for a human instead of falling back.
const ALREADY_PAID = ['DUPLICATE_INVOICE_ID', 'DUPLICATE_REQUEST_ID'];
const issueOf = (err: PayPalApiError) => err.body?.details?.[0]?.issue ?? err.body?.name;

function checkoutInput(entry: LedgerEntry, merchant: Merchant, request: SpendRequest, token: string) {
  return {
    ledgerEntryId: entry.id,
    paymentTokenId: token,
    merchantEmail: merchant.sandboxEmail,
    amountCents: entry.amountCents,
    itemName: request.reason,
    description: `KubePay vault purchase at ${merchant.name}`,
    productUrl: request.product_url,
  };
}

/**
 * Pays a held SPEND entry with Checkout. Returns the result, or null when the shop should be paid
 * with Payouts instead (Checkout not set up, or PayPal refused it and nothing was paid).
 * Throws when the outcome is unclear: the money stays held and the sweeper retries the same order.
 */
export async function payWithCheckout(entry: LedgerEntry, merchant: Merchant, request: SpendRequest) {
  const token = await platformCheckoutToken();
  if (!token) return null;
  await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paidVia: 'CHECKOUT' } });

  let result: CheckoutPayment;
  try {
    result = await payMerchantWithCheckout(checkoutInput(entry, merchant, request, token));
  } catch (err) {
    const refused = err instanceof PayPalApiError && err.status >= 400 && err.status < 500 && !ALREADY_PAID.includes(issueOf(err));
    if (!refused) throw err;
    console.warn(`Checkout refused for ledger entry ${entry.id} (${issueOf(err as PayPalApiError)}): paying with Payouts instead.`);
    await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paidVia: 'PAYOUTS' } });
    return null;
  }
  return applyCheckout(entry.id, result);
}

/** Records PayPal's answer. Null = nothing was paid, so pay with Payouts. */
async function applyCheckout(entryId: string, result: CheckoutPayment) {
  if (result.captureStatus === 'DECLINED' || result.captureStatus === 'FAILED' || !result.captureId) {
    console.warn(`Checkout not captured for ledger entry ${entryId} (${result.captureStatus ?? result.orderStatus}): paying with Payouts instead.`);
    await prisma.ledgerEntry.update({ where: { id: entryId }, data: { paidVia: 'PAYOUTS' } });
    return null;
  }
  const ledgerEntry = await prisma.ledgerEntry.update({ where: { id: entryId }, data: { paypalRef: result.captureId } });
  if (result.captureStatus === 'COMPLETED') await onPayoutSucceeded(entryId, result.captureId);
  // PENDING (e.g. PayPal review): settled later by the webhook or syncPendingCheckouts.
  return { ledgerEntry: await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: ledgerEntry.id } }), checkout: result };
}

/** Settles Checkout purchases still PENDING at PayPal (webhook backup). */
export async function syncPendingCheckouts(vaultId?: string) {
  const pending = await prisma.ledgerEntry.findMany({
    where: { status: 'PENDING', type: 'SPEND', paidVia: 'CHECKOUT', paypalRef: { not: null }, ...(vaultId ? { vaultId } : {}) },
  });
  for (const entry of pending) {
    const capture = await getCapture(entry.paypalRef!).catch((err) => {
      console.error(`Checkout sync for ledger entry ${entry.id} failed:`, (err as Error).message);
      return null;
    });
    if (capture) await settleCapture(entry.id, capture.status);
  }
  return pending.length;
}

/** COMPLETED -> paid; DECLINED / FAILED -> money back in the vault. Anything else: still waiting. */
export async function settleCapture(entryId: string, status: string) {
  if (status === 'COMPLETED') return onPayoutSucceeded(entryId);
  if (status === 'DECLINED' || status === 'FAILED') return onPayoutFailed(entryId, `Checkout payment ${status.toLowerCase()}`);
  return false;
}

/**
 * Checkout purchases whose PayPal call ended unclearly (no capture id after 2 minutes). Re-sending
 * the same order is safe: the ledger entry id is the PayPal-Request-Id and the invoice id.
 */
export async function resumeStuckCheckouts(olderThanMs = 2 * 60_000) {
  const stuck = await prisma.ledgerEntry.findMany({
    where: { status: 'PENDING', type: 'SPEND', paidVia: 'CHECKOUT', paypalRef: null, createdAt: { lt: new Date(Date.now() - olderThanMs) } },
    include: { merchant: true, decision: true },
  });
  const token = stuck.length ? await platformCheckoutToken() : null;
  for (const entry of stuck) {
    const request = SpendRequestSchema.safeParse(entry.decision?.requestJson);
    if (!entry.merchant || !request.success || !token) continue;
    try {
      // Not captured -> marked PAYOUTS, and resumeStuckPayouts pays the shop that way next.
      await applyCheckout(entry.id, await payMerchantWithCheckout(checkoutInput(entry, entry.merchant, request.data, token)));
    } catch (err) {
      // A clear refusal (nothing paid) falls back to Payouts; anything unclear stays held and is retried.
      if (err instanceof PayPalApiError && err.status >= 400 && err.status < 500 && !ALREADY_PAID.includes(issueOf(err))) {
        await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { paidVia: 'PAYOUTS' } });
      } else {
        console.error(`Could not resume Checkout for ledger entry ${entry.id}:`, (err as Error).message);
      }
    }
  }
  return stuck.length;
}
