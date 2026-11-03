import express, { Router, type Request, type Response } from 'express';
import { addFunding, failFunding, prisma } from '@kubepay/db';
import { getSubscription, valueToCents, verifyWebhook, type WebhookApp } from '@kubepay/paypal';
import { emit } from './events.ts';
import { HttpError } from './http.ts';
import { settleCapture } from './services/checkout.ts';
import { finishFunding } from './services/funding.ts';
import { onMoneyRequestEvent } from './services/fund-requests.ts';
import { syncPendingPayouts } from './services/payouts.ts';
import { onPayoutFailed, onPayoutSucceeded } from './services/settle.ts';

// PayPal webhooks (Step 9). Each event is verified with PayPal, stored once by its event id,
// then applied to the ledger. Every handler is safe to run twice, and the sync route stays as a
// fallback, so a missed or repeated webhook never moves money twice.
//   POST /webhooks/paypal          platform app: funding, payouts, subscriptions
//   POST /webhooks/paypal/utility  city-utility app: its invoices

export type PayPalEvent = { id: string; event_type: string; resource: any };

const PAYOUT_ITEM_FAILED = ['FAILED', 'BLOCKED', 'RETURNED', 'REFUNDED', 'DENIED', 'CANCELED'].map((s) => `PAYMENT.PAYOUTS-ITEM.${s}`);

export const webhooksRouter = Router();
webhooksRouter.use(express.raw({ type: '*/*', limit: '1mb' })); // verification needs the exact bytes
webhooksRouter.post('/paypal', (req, res) => receive('platform', req, res));
webhooksRouter.post('/paypal/utility', (req, res) => receive('utility', req, res));

async function receive(app: WebhookApp, req: Request, res: Response) {
  const idVar = app === 'utility' ? 'UTILITY_WEBHOOK_ID' : 'PAYPAL_WEBHOOK_ID';
  if (!process.env[idVar]?.trim()) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED', { missing: idVar });

  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!raw || !(await verifyWebhook(req.headers, raw, app))) throw new HttpError(400, 'INVALID_WEBHOOK_SIGNATURE');
  res.json(await processEvent(JSON.parse(raw)));
}

/** Stores the event once, applies it, and marks it processed. A failed event is retried by PayPal. */
export async function processEvent(event: PayPalEvent) {
  const stored = await prisma.paypalEvent.findUnique({ where: { id: event.id } });
  if (stored?.processed) return { eventId: event.id, duplicate: true };
  if (!stored) {
    await prisma.paypalEvent
      .create({ data: { id: event.id, type: event.event_type, payload: event as any } })
      .catch((err) => {
        if (err?.code !== 'P2002') throw err; // another delivery of the same event is being stored
      });
  }

  const result = await handleEvent(event);
  await prisma.paypalEvent.update({ where: { id: event.id }, data: { processed: true } });
  console.log(`[webhook] ${event.event_type} ${event.id}: ${result.action}`);
  return { eventId: event.id, ...result };
}

async function handleEvent(event: PayPalEvent): Promise<{ action: string; vaultId?: string }> {
  const r = event.resource ?? {};
  const type = event.event_type;

  // ---- Vault purchases paid with PayPal Checkout (capture custom_id = SPEND ledger entry id) ----
  if (type === 'PAYMENT.CAPTURE.COMPLETED' || type === 'PAYMENT.CAPTURE.DENIED') {
    const spend = await checkoutSpend(r.custom_id);
    if (spend) {
      await settleCapture(spend.id, type === 'PAYMENT.CAPTURE.COMPLETED' ? 'COMPLETED' : 'DECLINED');
      return { action: type === 'PAYMENT.CAPTURE.COMPLETED' ? 'purchase settled' : 'purchase declined, money back in vault', vaultId: spend.vaultId };
    }
  }

  // ---- Funding (Orders API) ----
  if (type === 'CHECKOUT.ORDER.APPROVED' || type === 'PAYMENT.CAPTURE.COMPLETED') {
    // APPROVED: the user approved in PayPal; we capture it now (no need to wait for the browser).
    const orderId = type === 'CHECKOUT.ORDER.APPROVED' ? r.id : r.supplementary_data?.related_ids?.order_id;
    if (!(await isOurFundingOrder(orderId))) return { action: 'ignored: not a KubePay funding order' };
    const { vault } = await finishFunding(orderId, { capture: type === 'CHECKOUT.ORDER.APPROVED' });
    return { action: 'vault funded', vaultId: vault.id };
  }
  if (type === 'PAYMENT.CAPTURE.DENIED') {
    const orderId = r.supplementary_data?.related_ids?.order_id;
    const entry = orderId && (await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } }));
    if (!entry) return { action: 'ignored: unknown order' };
    await failFunding(orderId, 'capture denied');
    emit('ledger:updated', { vaultId: entry.vaultId, entryId: entry.id });
    return { action: 'funding failed', vaultId: entry.vaultId };
  }

  // ---- Payouts (spends and liquidations). sender_item_id / sender_batch_id = ledger entry id ----
  if (type === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED' || PAYOUT_ITEM_FAILED.includes(type)) {
    const entry = await outflowEntry(r.payout_item?.sender_item_id);
    if (!entry) return { action: 'ignored: unknown payout item' };
    if (type === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED') await onPayoutSucceeded(entry.id, r.payout_item_id);
    else await onPayoutFailed(entry.id, `Payout ${type.split('.').pop()}: ${r.errors?.message ?? r.transaction_status ?? ''}`.trim());
    return { action: type === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED' ? 'payout settled' : 'payout failed, money back in vault', vaultId: entry.vaultId };
  }
  if (type === 'PAYMENT.PAYOUTSBATCH.DENIED') {
    const entry = await outflowEntry(r.batch_header?.sender_batch_header?.sender_batch_id);
    if (!entry) return { action: 'ignored: unknown payout batch' };
    await onPayoutFailed(entry.id, 'Payout batch denied');
    return { action: 'payout failed, money back in vault', vaultId: entry.vaultId };
  }
  if (type === 'PAYMENT.PAYOUTSBATCH.SUCCESS') {
    // Item events carry the result; this is a backstop in case one of them was missed.
    const entry = await outflowEntry(r.batch_header?.sender_batch_header?.sender_batch_id);
    if (entry?.status === 'PENDING') await syncPendingPayouts(entry.vaultId);
    return { action: entry ? 'payout batch synced' : 'ignored: unknown payout batch', vaultId: entry?.vaultId };
  }

  // ---- Subscriptions (utility vault monthly top-up) ----
  if (type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    const vaultId = await linkSubscription(r.id);
    return { action: vaultId ? 'subscription linked' : 'ignored: not a KubePay subscription', vaultId: vaultId ?? undefined };
  }
  if (type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    const vault = await prisma.vault.findUnique({ where: { paypalSubscriptionId: r.id } });
    if (!vault) return { action: 'ignored: unknown subscription' };
    await prisma.vault.update({ where: { id: vault.id }, data: { paypalSubscriptionId: null } });
    emit('vault:updated', { vaultId: vault.id });
    return { action: 'subscription cancelled, no more top-ups', vaultId: vault.id };
  }
  if (type === 'PAYMENT.SALE.COMPLETED') {
    const subscriptionId: string | undefined = r.billing_agreement_id;
    if (!subscriptionId) return { action: 'ignored: not a subscription payment' };
    const vaultId =
      (await prisma.vault.findUnique({ where: { paypalSubscriptionId: subscriptionId } }))?.id ?? (await linkSubscription(subscriptionId));
    if (!vaultId) return { action: 'ignored: unknown subscription' };
    await addFunding(vaultId, valueToCents(r.amount?.total ?? r.amount?.value), r.id);
    emit('vault:updated', { vaultId });
    emit('ledger:updated', { vaultId });
    return { action: 'subscription top-up added', vaultId };
  }

  // ---- Invoices: "Ask a friend" money requests (platform app) and utility bills (city-utility app) ----
  if (type === 'INVOICING.INVOICE.PAID' || type === 'INVOICING.INVOICE.CANCELLED') {
    const invoiceId: string | undefined = r.invoice?.id ?? r.id;
    const asked = invoiceId ? await onMoneyRequestEvent(invoiceId) : null;
    if (asked) return { action: `money request ${asked.status.toLowerCase()}`, vaultId: asked.vaultId };
    const spend = invoiceId
      ? await prisma.ledgerEntry.findFirst({
          where: { type: 'SPEND', decision: { requestJson: { path: ['invoice_id'], equals: invoiceId } } },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    if (!spend) return { action: 'ignored: invoice not paid by a vault' };
    emit('ledger:updated', { vaultId: spend.vaultId, entryId: spend.id, invoiceId, invoiceStatus: type.split('.').pop() });
    return { action: `invoice ${type.split('.').pop()!.toLowerCase()}`, vaultId: spend.vaultId };
  }

  return { action: 'ignored: event type not used' };
}

async function isOurFundingOrder(orderId: string | undefined) {
  if (!orderId) return false;
  const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } });
  return entry?.type === 'FUND';
}

async function checkoutSpend(entryId: string | undefined) {
  if (!entryId) return null;
  const entry = await prisma.ledgerEntry.findUnique({ where: { id: entryId } });
  return entry?.type === 'SPEND' && entry.paidVia === 'CHECKOUT' ? entry : null;
}

async function outflowEntry(entryId: string | undefined) {
  if (!entryId) return null;
  const entry = await prisma.ledgerEntry.findUnique({ where: { id: entryId } });
  return entry && (entry.type === 'SPEND' || entry.type === 'LIQUIDATE') ? entry : null;
}

/** Links a PayPal subscription to the utility vault named in its custom_id. Returns the vault id. */
async function linkSubscription(subscriptionId: string): Promise<string | null> {
  const sub = await getSubscription(subscriptionId);
  if (!sub.vaultId || sub.planId !== process.env.PAYPAL_UTILITY_PLAN_ID) return null;
  const vault = await prisma.vault.findUnique({ where: { id: sub.vaultId } });
  if (!vault || vault.type !== 'UTILITY') return null;
  if (vault.paypalSubscriptionId !== subscriptionId) {
    await prisma.vault.update({ where: { id: vault.id }, data: { paypalSubscriptionId: subscriptionId } });
    emit('vault:updated', { vaultId: vault.id });
  }
  return vault.id;
}
