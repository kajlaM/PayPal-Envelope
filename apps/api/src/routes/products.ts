import { Router } from 'express';
import { prisma } from '@paypalvault/db';
import { lookupProduct, ProductLookupError } from '@paypalvault/agents';
import { ProductLookupBody } from '../api-schemas.ts';
import { HttpError } from '../http.ts';

export const productsRouter = Router();

// Start a vault from a product link: Channel3 turns the link into the product, its stores and its
// 90-day price history. Also says whether its store is one of the approved shops.
productsRouter.post('/lookup', async (req, res) => {
  const { url } = ProductLookupBody.parse(req.body);
  try {
    const product = await lookupProduct(url);
    const approved = await prisma.merchant.findMany({ where: { approved: true, domain: { not: null } }, select: { name: true, domain: true } });
    const shopOf = (host: string) => approved.find((m) => host === m.domain || host.endsWith(`.${m.domain}`))?.name ?? null;
    res.json({
      ...product,
      approvedShop: shopOf(product.shop),
      offers: product.offers.map((o) => ({ ...o, approvedShop: shopOf(o.shop) })),
    });
  } catch (err) {
    if (err instanceof ProductLookupError) throw new HttpError(422, 'PRODUCT_LOOKUP_FAILED', { message: err.message });
    throw err;
  }
});
