import { prisma } from '@kubepay/db';
import { getInvoice, PayPalApiError } from '@kubepay/paypal';
import type { EngineContext, SpendRequest } from '@kubepay/policy';
import { spendAnomaly } from './audit.ts';

const DAY_MS = 86_400_000;

/** Gathers everything the Policy Engine needs to judge one spend request. */
export async function buildEngineContext(
  vault: { id: string; type: 'SHOPPING' | 'UTILITY' | 'SAVINGS' },
  request: SpendRequest,
): Promise<EngineContext> {
  const [recent, merchant, anomalyScore, itemSpent] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { vaultId: vault.id, type: 'SPEND', status: { not: 'FAILED' }, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      include: { merchant: true },
    }),
    prisma.merchant.findFirst({ where: { name: { equals: request.merchant, mode: 'insensitive' }, approved: true } }),
    spendAnomaly(vault.id, request),
    vault.type === 'SHOPPING' ? itemSpentCents(vault.id) : undefined,
  ]);

  const ctx: EngineContext = {
    recentSpends: recent.map((e) => ({ merchant: e.merchant?.name ?? '', amountCents: e.amountCents, at: e.createdAt })),
    merchant: merchant && { name: merchant.name, category: merchant.category },
    anomalyScore, // Elastic, Step 11 (undefined when audit is off)
    itemSpentCents: itemSpent,
  };

  if (vault.type === 'UTILITY' && request.invoice_id) {
    ctx.invoice = await invoiceContext(request.invoice_id, merchant?.sandboxEmail);
  }
  return ctx;
}

/** Shopping-list vaults: per item id, money spent on it (payments that did not fail). */
export async function itemSpentCents(vaultId: string): Promise<Record<string, number>> {
  const rows = await prisma.ledgerEntry.groupBy({
    by: ['itemId'],
    where: { vaultId, type: 'SPEND', status: { not: 'FAILED' }, itemId: { not: null } },
    _sum: { amountCents: true },
  });
  return Object.fromEntries(rows.map((r) => [r.itemId!, r._sum.amountCents ?? 0]));
}

async function invoiceContext(invoiceId: string, merchantEmail?: string): Promise<EngineContext['invoice']> {
  try {
    const invoice = await getInvoice(invoiceId);
    // Paid already by any vault (a spend for this invoice that did not fail)?
    const paid = await prisma.ledgerEntry.findFirst({
      where: { type: 'SPEND', status: { not: 'FAILED' }, decision: { requestJson: { path: ['invoice_id'], equals: invoiceId } } },
    });
    return {
      found: true,
      status: invoice.status,
      amountCents: invoice.amountCents,
      issuedByMerchant: !!merchantEmail && invoice.invoicerEmail?.toLowerCase() === merchantEmail.toLowerCase(),
      alreadyPaid: !!paid,
    };
  } catch (err) {
    if (err instanceof PayPalApiError && (err.status === 404 || err.status === 400)) return { found: false };
    throw err;
  }
}
