import { completeFunding, prisma } from '@kubepay/db';
import { captureOrder } from '@kubepay/paypal';
import { emit } from '../events.ts';
import { HttpError } from '../http.ts';
import { startWatching } from './agent-runs.ts';

/**
 * Captures an approved funding order and credits the vault. Used by the capture route (button flow)
 * and by the CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED webhooks. Safe to call twice:
 * the capture uses a fixed PayPal-Request-Id and completeFunding only credits a PENDING entry.
 */
export async function finishFunding(orderId: string, opts: { capture?: boolean } = { capture: true }) {
  const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } });
  if (!entry || entry.type !== 'FUND') throw new HttpError(404, 'ORDER_NOT_FOUND');

  if (entry.status === 'PENDING' && opts.capture) {
    const capture = await captureOrder(orderId);
    if (capture.captureStatus !== 'COMPLETED') throw new HttpError(402, 'CAPTURE_NOT_COMPLETED', { status: capture.captureStatus });
  }
  const vault = await completeFunding(orderId);
  await startWatching(vault.id); // shopping vaults: the agent starts looking right away
  emit('vault:updated', { vaultId: vault.id });
  emit('ledger:updated', { vaultId: vault.id, entryId: entry.id });
  return { vault, entry };
}
