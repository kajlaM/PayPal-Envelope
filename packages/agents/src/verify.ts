import Kernel from '@onkernel/sdk';
import { chromium } from 'playwright-core';
import { kernelKey } from './config.ts';

export type Listing = {
  price: number | null; // live price on the product page, USD
  seller: string | null;
  title: string | null;
  verifiedBy: 'kernel' | 'fetch';
};

/** Reads price, seller, and title from a product page (schema.org JSON-LD, then meta tags). */
export function extractListing(html: string): Omit<Listing, 'verifiedBy'> {
  const out: Omit<Listing, 'verifiedBy'> = { price: null, seller: null, title: null };

  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, json] of blocks) {
    let data: any;
    try {
      data = JSON.parse(json!);
    } catch {
      continue;
    }
    const nodes: any[] = [data, ...(Array.isArray(data) ? data : []), ...(data['@graph'] ?? [])];
    const product = nodes.find((n) => n && [n['@type']].flat().includes('Product'));
    if (!product) continue;
    const offer = [product.offers].flat()[0];
    const price = Number(offer?.price ?? offer?.lowPrice);
    if (Number.isFinite(price) && price > 0 && (!offer?.priceCurrency || offer.priceCurrency === 'USD')) out.price = price;
    out.seller = offer?.seller?.name ?? product.brand?.name ?? null;
    out.title = product.name ?? null;
    if (out.price !== null) return out;
  }

  const meta = (prop: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|itemprop|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1];
  const price = Number(meta('product:price:amount') ?? meta('og:price:amount') ?? meta('price'));
  if (Number.isFinite(price) && price > 0) out.price = price;
  out.title ??= meta('og:title') ?? null;
  out.seller ??= meta('og:site_name') ?? null;
  return out;
}

/**
 * Opens the product page and reads the live price, so a vendor cannot charge more than it shows.
 * Uses a Kernel cloud browser when KERNEL_API_KEY is set, otherwise a plain HTTP fetch.
 */
export async function verifyListing(url: string): Promise<Listing> {
  const key = kernelKey();
  if (!key) {
    const res = await fetch(url, { headers: { 'user-agent': 'PayPalVault-Agent/0.1' } });
    if (!res.ok) throw new Error(`Could not open ${url} (${res.status})`);
    return { ...extractListing(await res.text()), verifiedBy: 'fetch' };
  }

  const kernel = new Kernel({ apiKey: key });
  const session = await kernel.browsers.create();
  try {
    const browser = await chromium.connectOverCDP(session.cdp_ws_url);
    const page = browser.contexts()[0]?.pages()[0] ?? (await browser.newPage());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const listing = extractListing(await page.content());
    await browser.close();
    return { ...listing, verifiedBy: 'kernel' };
  } finally {
    await kernel.browsers.deleteByID(session.session_id).catch(() => undefined);
  }
}
