import { prisma, type LedgerEntry, type PayPalCheck } from '@paypalvault/db';
import { getCaptureDetails, getMoneyRequest, getOrder, getPayout, PayPalApiError, isRequestPaid, valueToCents } from '@paypalvault/paypal';
import { emit } from '../events.ts';

// "Verified by PayPal". All vault money sits in one PayPal account (the platform's); the split into
// vaults exists only in our ledger. This asks PayPal about every ledger entry and compares: same
// amount, same status, right person or shop. It ONLY READS from PayPal; it never moves money and
// never changes the ledger's own amounts or statuses. A difference is shown and emailed; fixing it
// stays a human decision.
//
// How an entry is found at PayPal (the ids the code already saves when the money moves):
//   FUND, paypalRef = order id      -> Orders API (SDK): capture status, amount, payer, custom_id = vault id
//   FUND, paypalRef = INV2-...      -> Invoicing API: the friend's money request, paid amount
//   SPEND via CHECKOUT, capture id  -> Payments API (SDK) + its order: status, amount, payee = the shop
//   SPEND via Payouts, LIQUIDATE    -> Payouts API: item status, amount, receiver (shop / vault owner)

export type CheckResult = { check: PayPalCheck; note: string; txnId?: string | null };

type Entry = LedgerEntry & { merchant: { name: string; sandboxEmail: string } | null };
type Context = { vaultId: string; ownerEmail: string };

const SETTLE_MS = 30 * 60_000; // younger than this, PayPal may still be processing: WAITING, not MISMATCH
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const same = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const young = (e: Entry) => Date.now() - e.createdAt.getTime() < SETTLE_MS;

/** Asks PayPal about one ledger entry. Read-only. */
export async function checkEntry(e: Entry, ctx: Context): Promise<CheckResult> {
  if (!e.paypalRef) {
    if (e.status === 'PENDING') return { check: 'WAITING', note: 'Not sent to PayPal yet.' };
    return { check: 'UNCHECKED', note: e.status === 'FAILED' ? 'Never reached PayPal, so no money moved.' : 'No PayPal reference saved.' };
  }
  try {
    if (e.type === 'FUND') return e.paypalRef.startsWith('INV2-') ? await checkMoneyRequest(e) : await checkFunding(e, ctx);
    if (e.type === 'SPEND' && e.paidVia === 'CHECKOUT') return await checkCheckout(e);
    return await checkPayout(e, ctx);
  } catch (err) {
    if (err instanceof PayPalApiError && err.status === 404) {
      // A funding that was never paid: PayPal drops unpaid orders after a while, so nothing was taken.
      if (e.type === 'FUND' && e.status !== 'COMPLETED') {
        return { check: 'UNCHECKED', note: 'This payment was never completed and PayPal no longer has it, so no money was taken.' };
      }
      // A subscription payment (utility auto top-up) is a "sale", not an order: PayPal's Orders API
      // does not know it. Its webhook already confirmed it; nothing more to read here.
      return { check: 'UNCHECKED', note: 'PayPal has no order or payout with this reference (e.g. a subscription payment).' };
    }
    throw err; // PayPal unreachable or the like: try again next time, keep the last result
  }
}

// Vault funding: the customer paid the platform (PayPal button, Pay Later, saved PayPal, savings payment).
async function checkFunding(e: Entry, ctx: Context): Promise<CheckResult> {
  const order = await getOrder(e.paypalRef!);
  const unit = order.purchaseUnits?.[0];
  const capture = unit?.payments?.captures?.[0];
  const captured = capture?.status === 'COMPLETED';
  const paidCents = capture?.amount?.value ? valueToCents(capture.amount.value) : 0;
  const txnId = capture?.id ?? null;
  const vaultId = capture?.customId ?? unit?.customId;
  const payer = order.payer?.emailAddress;

  if (e.status === 'FAILED') {
    return captured
      ? { check: 'MISMATCH', note: `PayPal took ${usd(paidCents)} for this payment, but the vault marked it as failed.`, txnId }
      : { check: 'VERIFIED', note: 'PayPal confirms no money was taken.', txnId };
  }
  if (!captured) {
    if (capture?.status === 'PENDING' || e.status === 'PENDING' || young(e)) return { check: 'WAITING', note: `PayPal shows this payment as ${String(capture?.status ?? order.status).toLowerCase()}.`, txnId };
    if (capture?.status === 'REFUNDED' || capture?.status === 'PARTIALLY_REFUNDED') return { check: 'MISMATCH', note: 'PayPal shows this payment was refunded to the payer.', txnId };
    return { check: 'MISMATCH', note: `PayPal shows no completed payment for this (order ${String(order.status).toLowerCase()}).`, txnId };
  }
  if (e.status === 'PENDING') {
    return young(e)
      ? { check: 'WAITING', note: 'PayPal has the money; the vault is catching up.', txnId }
      : { check: 'MISMATCH', note: `PayPal received ${usd(paidCents)}, but the vault still waits for it.`, txnId };
  }
  if (paidCents !== e.amountCents) return { check: 'MISMATCH', note: `PayPal received ${usd(paidCents)}, the vault says ${usd(e.amountCents)}.`, txnId };
  if (vaultId && vaultId !== ctx.vaultId) return { check: 'MISMATCH', note: 'PayPal shows this payment for a different vault.', txnId };
  if (payer && !same(payer, ctx.ownerEmail)) return { check: 'MISMATCH', note: `PayPal shows ${payer} paid this, not the vault owner.`, txnId };
  return { check: 'VERIFIED', note: `PayPal received ${usd(paidCents)}${payer ? ` from ${payer}` : ''}.`, txnId };
}

// "Ask a friend": the friend paid the platform's PayPal money request.
async function checkMoneyRequest(e: Entry): Promise<CheckResult> {
  const r = await getMoneyRequest(e.paypalRef!);
  const txnId = r.paymentId ?? null;
  const paid = isRequestPaid(r);
  if (e.status === 'FAILED') return paid ? { check: 'MISMATCH', note: 'PayPal shows the friend paid, but the vault marked it as failed.', txnId } : { check: 'VERIFIED', note: 'PayPal confirms it was not paid.', txnId };
  if (!paid) return e.status === 'PENDING' || young(e) ? { check: 'WAITING', note: `PayPal shows the request as ${r.status.toLowerCase()}.`, txnId } : { check: 'MISMATCH', note: `PayPal shows the request as ${r.status.toLowerCase()}, not paid.`, txnId };
  const cents = r.paidCents || r.amountCents;
  if (cents !== e.amountCents) return { check: 'MISMATCH', note: `PayPal received ${usd(cents)}, the vault says ${usd(e.amountCents)}.`, txnId };
  return { check: 'VERIFIED', note: `PayPal received ${usd(cents)} from the friend's money request.`, txnId };
}

// A purchase paid with PayPal Checkout: the platform paid the shop (payee) directly.
async function checkCheckout(e: Entry): Promise<CheckResult> {
  const capture = await getCaptureDetails(e.paypalRef!);
  const txnId = capture.captureId;
  const shop = e.merchant;
  if (capture.status === 'REFUNDED' || capture.status === 'PARTIALLY_REFUNDED') {
    const when = capture.updatedAt ? ` on ${new Date(capture.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
    return { check: 'MISMATCH', note: `PayPal shows ${shop?.name ?? 'the shop'} refunded this ${usd(capture.amountCents)}${when}; the vault does not know yet.`, txnId };
  }
  if (e.status === 'FAILED') return capture.status === 'COMPLETED' ? { check: 'MISMATCH', note: 'PayPal shows the shop was paid, but the vault marked it as failed.', txnId } : { check: 'VERIFIED', note: 'PayPal confirms the shop was not paid.', txnId };
  if (capture.status !== 'COMPLETED') {
    return capture.status === 'PENDING' || e.status === 'PENDING' || young(e)
      ? { check: 'WAITING', note: `PayPal shows this payment as ${capture.status.toLowerCase()}.`, txnId }
      : { check: 'MISMATCH', note: `PayPal shows this payment as ${capture.status.toLowerCase()}.`, txnId };
  }
  if (capture.amountCents !== e.amountCents) return { check: 'MISMATCH', note: `PayPal paid ${usd(capture.amountCents)}, the vault says ${usd(e.amountCents)}.`, txnId };
  if (capture.customId && capture.customId !== e.id) return { check: 'MISMATCH', note: 'PayPal shows this payment for a different purchase.', txnId };
  if (capture.orderId && shop) {
    const payee = (await getOrder(capture.orderId)).purchaseUnits?.[0]?.payee?.emailAddress;
    if (payee && !same(payee, shop.sandboxEmail)) return { check: 'MISMATCH', note: `PayPal shows the money went to ${payee}, not ${shop.name}.`, txnId };
  }
  return { check: 'VERIFIED', note: `PayPal paid ${usd(capture.amountCents)} to ${shop?.name ?? 'the shop'}.`, txnId };
}

// Payouts: a purchase paid with Payouts (to the shop), or leftover money back to the owner (LIQUIDATE).
async function checkPayout(e: Entry, ctx: Context): Promise<CheckResult> {
  const batch = await getPayout(e.paypalRef!);
  const item = batch.items.find((i) => i.ledgerEntryId === e.id) ?? (batch.items.length === 1 ? batch.items[0] : undefined);
  if (!item) return { check: 'MISMATCH', note: 'PayPal has this payout, but not for this entry.' };
  const txnId = item.transactionId ?? null;
  const to = e.type === 'LIQUIDATE' ? { email: ctx.ownerEmail, name: 'your PayPal' } : { email: e.merchant?.sandboxEmail, name: e.merchant?.name ?? 'the shop' };
  const gone = ['FAILED', 'RETURNED', 'BLOCKED', 'REFUNDED', 'REVERSED'].includes(item.status);
  if (e.status === 'FAILED') return gone ? { check: 'VERIFIED', note: `PayPal confirms the payout did not go through (${item.status.toLowerCase()}).`, txnId } : item.status === 'SUCCESS' ? { check: 'MISMATCH', note: 'PayPal shows this payout succeeded, but the vault marked it as failed.', txnId } : { check: 'WAITING', note: `PayPal shows this payout as ${item.status.toLowerCase()}.`, txnId };
  if (gone) return { check: 'MISMATCH', note: `PayPal shows this payout was ${item.status.toLowerCase()}; the money is not with ${to.name}.`, txnId };
  if (item.status !== 'SUCCESS') return { check: 'WAITING', note: item.status === 'UNCLAIMED' ? `PayPal holds the money until ${to.name === 'your PayPal' ? 'you accept it' : `${to.name} accepts it`}.` : `PayPal shows this payout as ${item.status.toLowerCase()}.`, txnId };
  if (item.amountCents !== e.amountCents) return { check: 'MISMATCH', note: `PayPal sent ${usd(item.amountCents)}, the vault says ${usd(e.amountCents)}.`, txnId };
  if (item.receiver && to.email && !same(item.receiver, to.email)) return { check: 'MISMATCH', note: `PayPal sent this to ${item.receiver}, not ${to.name}.`, txnId };
  return { check: 'VERIFIED', note: `PayPal sent ${usd(item.amountCents)} to ${e.type === 'LIQUIDATE' ? item.receiver ?? 'your PayPal' : to.name}.`, txnId };
}

// ---------- Running the check ----------

export type VaultVerification = {
  vaultId: string;
  checkedAt: string;
  counts: Record<PayPalCheck, number>;
  balanceMatches: boolean; // money in minus money out (ledger) = the vault's balance
  mismatches: { entryId: string; note: string }[];
  errors: number; // entries PayPal could not be asked about this time (kept their last result)
};

/** Checks every ledger entry of one vault against PayPal, saves the results and returns a summary. */
export async function verifyVault(vaultId: string): Promise<VaultVerification> {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { id: vaultId },
    include: { user: true, ledger: { include: { merchant: { select: { name: true, sandboxEmail: true } } }, orderBy: { createdAt: 'asc' } } },
  });
  const ctx = { vaultId, ownerEmail: vault.user.paypalEmail };
  const counts: Record<PayPalCheck, number> = { VERIFIED: 0, WAITING: 0, MISMATCH: 0, UNCHECKED: 0 };
  const mismatches: VaultVerification['mismatches'] = [];
  const newMismatches: { entry: Entry; note: string }[] = [];
  let errors = 0;
  const checkedAt = new Date();

  for (const entry of vault.ledger) {
    let result: CheckResult;
    try {
      result = await checkEntry(entry, ctx);
    } catch (err) {
      errors += 1;
      console.warn(`Verify ${entry.id}: PayPal could not be asked (${(err as Error).message.slice(0, 120)})`);
      if (entry.paypalCheck) counts[entry.paypalCheck] += 1;
      continue;
    }
    counts[result.check] += 1;
    if (result.check === 'MISMATCH') {
      mismatches.push({ entryId: entry.id, note: result.note });
      if (entry.paypalCheck !== 'MISMATCH' || entry.paypalCheckNote !== result.note) newMismatches.push({ entry, note: result.note });
    }
    await prisma.ledgerEntry.update({
      where: { id: entry.id },
      data: { paypalCheck: result.check, paypalCheckNote: result.note, paypalCheckedAt: checkedAt, ...(result.txnId ? { paypalTxnId: result.txnId } : {}) },
    });
  }

  const sum = (type: string, counted: (s: string) => boolean) =>
    vault.ledger.filter((e) => e.type === type && counted(e.status)).reduce((n, e) => n + e.amountCents, 0);
  const ledgerBalance = sum('FUND', (s) => s === 'COMPLETED') - sum('SPEND', (s) => s !== 'FAILED') - sum('LIQUIDATE', (s) => s !== 'FAILED');
  const balanceMatches = ledgerBalance === vault.balanceCents;
  if (!balanceMatches) mismatches.push({ entryId: '', note: `The vault shows ${usd(vault.balanceCents)}, its payments add up to ${usd(ledgerBalance)}.` });

  // One alert per new difference (the email goes through the existing Zapier alerts).
  for (const m of newMismatches) emit('verify:mismatch', { vaultId, entryId: m.entry.id, note: m.note });
  emit('vault:updated', { vaultId, verifiedAt: checkedAt.toISOString() });
  return { vaultId, checkedAt: checkedAt.toISOString(), counts, balanceMatches, mismatches, errors };
}

/** Checks every vault (the nightly run). One vault at a time, to stay gentle on PayPal's API. */
export async function verifyAllVaults() {
  const vaults = await prisma.vault.findMany({ where: { ledger: { some: {} } }, select: { id: true } });
  const results: VaultVerification[] = [];
  for (const v of vaults) {
    try {
      results.push(await verifyVault(v.id));
    } catch (err) {
      console.error(`Verify vault ${v.id} failed:`, (err as Error).message.slice(0, 160));
    }
  }
  const total = (k: PayPalCheck) => results.reduce((n, r) => n + r.counts[k], 0);
  console.log(`PayPal check: ${results.length} vaults · ${total('VERIFIED')} verified · ${total('WAITING')} waiting · ${total('MISMATCH')} mismatched · ${total('UNCHECKED')} not checkable`);
  return results;
}
