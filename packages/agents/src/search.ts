import { apiUrl, channel3Key } from './config.ts';

export type Product = {
  title: string;
  price: number; // USD, as listed by the search result
  merchant: string; // registered merchant name when we know it, else the shop's domain
  url: string;
  condition: 'new' | 'used' | null;
  rating: number | null; // stars out of 5
  ratingCount: number | null;
  deliveryDays: number | null; // null when the source does not say
  categoryPath: string[]; // broad -> specific, e.g. ["Electronics", "Audio", "Headphones"]
  source: 'channel3' | 'demo-store';
  // Channel3 only (channel3.ts uses them to compare stores and check the price history):
  productId?: string | null; // Channel3 product id
  image?: string | null; // product photo (background removed when Channel3 has one)
  brand?: string | null;
  wasPrice?: number | null; // the shop's pre-discount price
};

export type MerchantInfo = { name: string; category: string; domain: string | null };

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const bareHost = (d: string) => d.toLowerCase().replace(/^www\./, '');

/** "www.bestbuy.com" -> "BestBuy" when a registered merchant matches, else the domain itself. */
export function merchantForDomain(domain: string, merchants: MerchantInfo[]): string {
  const host = bareHost(domain);
  const label = normalize(host.split('.')[0] ?? host);
  return (
    merchants.find((m) => m.domain && (host === m.domain || host.endsWith(`.${m.domain}`)))?.name ??
    merchants.find((m) => normalize(m.name) === label)?.name ??
    host
  );
}

/**
 * Searches every product source and returns all results (filtering and ranking happen in rank.ts).
 *  - Channel3 (CHANNEL3_API_KEY): real shops, limited to the approved merchants' websites.
 *  - Demo store (no Channel3 key, or DEMO_STORE=on): our fake shop with a price trap and price drops.
 */
export async function searchProducts(
  query: string,
  opts: { maxPrice: number; newOnly: boolean; merchants: MerchantInfo[] },
): Promise<Product[]> {
  const useDemo = !channel3Key() || process.env.DEMO_STORE?.trim().toLowerCase() === 'on';
  const sources = [channel3Key() ? searchChannel3(query, opts) : null, useDemo ? searchDemoStore(query) : null].filter(
    (p): p is Promise<Product[]> => p !== null,
  );
  const results = await Promise.allSettled(sources);
  const ok = results.filter((r): r is PromiseFulfilledResult<Product[]> => r.status === 'fulfilled');
  if (ok.length === 0) throw (results[0] as PromiseRejectedResult).reason;
  for (const r of results) if (r.status === 'rejected') console.warn('Product source failed:', (r.reason as Error).message);
  return ok.flatMap((r) => r.value);
}

async function searchDemoStore(query: string): Promise<Product[]> {
  const res = await fetch(`${apiUrl()}/demo-store/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Demo store search failed (${res.status})`);
  return res.json() as Promise<Product[]>;
}

// ---------- Channel3 ----------

const C3 = 'https://api.trychannel3.com';
const websiteIds = new Map<string, string | null>(); // domain -> Channel3 website id (cached)

export async function c3(path: string, init: RequestInit = {}) {
  const res = await fetch(`${C3}${path}`, {
    ...init,
    headers: { 'x-api-key': channel3Key()!, 'content-type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`Channel3 ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<any>;
}

async function websiteId(domain: string): Promise<string | null> {
  if (!websiteIds.has(domain)) {
    const { websites } = await c3(`/v1/websites/search?query=${encodeURIComponent(domain)}&limit=5`);
    websiteIds.set(domain, websites?.find((w: any) => bareHost(w.url) === domain)?.id ?? null);
  }
  return websiteIds.get(domain)!;
}

async function searchChannel3(query: string, opts: { maxPrice: number; newOnly: boolean; merchants: MerchantInfo[] }) {
  // Only shops of approved merchants that have a real website.
  const shops = opts.merchants.filter((m): m is MerchantInfo & { domain: string } => !!m.domain);
  const ids = (await Promise.all(shops.map((m) => websiteId(m.domain)))).filter((id): id is string => !!id);
  if (ids.length === 0) return [];

  const body = await c3('/v1/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      limit: 30,
      filters: {
        price: { max_price: opts.maxPrice },
        website_ids: ids,
        availability: ['InStock'],
        ...(opts.newOnly ? { conditions: ['new'] } : {}),
      },
    }),
  });

  const products: Product[] = [];
  for (const p of body.products ?? []) {
    for (const offer of p.offers ?? []) {
      const domain = bareHost(offer.domain ?? new URL(offer.url).hostname);
      if (!shops.some((m) => domain === m.domain || domain.endsWith(`.${m.domain}`))) continue;
      if (offer.availability && offer.availability !== 'InStock') continue;
      if (offer.price?.currency && offer.price.currency !== 'USD') continue;
      products.push({
        title: p.title,
        price: Number(offer.price?.price),
        merchant: merchantForDomain(domain, opts.merchants),
        url: offer.url,
        condition: offer.condition ?? null,
        rating: p.ratings?.value ?? null,
        ratingCount: p.ratings?.count ?? null,
        deliveryDays: null, // Channel3 does not report delivery time
        categoryPath: (p.category?.path ?? []).map((c: any) => c.title),
        source: 'channel3',
        productId: p.id ?? null,
        image: mainImage(p.images),
        brand: p.brands?.[0]?.name ?? null,
        wasPrice: Number(offer.price?.compare_at_price) > Number(offer.price?.price) ? Number(offer.price.compare_at_price) : null,
      });
    }
  }
  return products.filter((p) => p.price > 0);
}

/** Channel3's main photo, preferring the clean background-removed square. */
export function mainImage(images: any[] | undefined): string | null {
  const img = images?.find((i) => i.is_main_image) ?? images?.[0];
  return img?.cleaned_url ?? img?.url ?? null;
}
