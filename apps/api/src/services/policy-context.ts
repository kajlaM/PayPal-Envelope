import { prisma } from '@kubepay/db';
import { getInvoice, PayPalApiError } from '@kubepay/paypal';
import type { EngineContext, SpendRequest } from '@kubepay/policy';

const DAY_MS = 86_400_000;

/** Gathers everything the Policy Engine needs to judge one spend request. */
export async function buildEngineContext(
  vault: { id: string; type: 'SHOPPING' | 'UTILITY' },
  request: SpendRequest,
): Promise<EngineContext> {
  const [recent, merchant] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { vaultId: vault.id, type: 'SPEND', status: { not: 'FAILED' }, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      include: { merchant: true },
    }),
    prisma.merchant.findFirst({ where: { name: { equals: request.merchant, mode: 'insensitive' }, approved: true } }),
  ]);

  const ctx: EngineContext = {
    recentSpends: recent.map((e) => ({ merchant: e.merchant?.name ?? '', amountCents: e.amountCents, at: e.createdAt })),
    merchant: merchant && { name: merchant.name, category: merchant.category },
    // anomalyScore: filled by Elastic in Step 11
  };

  if (vault.type === 'UTILITY' && request.invoice_id) {
    ctx.invoice = await invoiceContext(request.invoice_id, merchant?.sandboxEmail);
  }
  return ctx;
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
