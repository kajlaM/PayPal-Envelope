import type { Channel3Insight } from '@kubepay/policy';
import { channel3Key } from './config.ts';
import { c3, type Product } from './search.ts';

// What Channel3's product data adds to a purchase decision (no AI, all deterministic):
//  1. Compare stores: the same model at every approved store, so the agent buys where it is cheapest.
//     Channel3 lists one product with several store offers, or the same model as separate listings;
//     both count (same brand + same model code, e.g. "WH-CH530").
//  2. Price history: Channel3's 90-day history says if today's price is low, typical or high.
//     The agent waits for a better price when it is clearly high (see shouldWaitForPrice).

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const UNIT = /^\d+(\.\d+)?(w|mm|cm|m|ft|in|gb|tb|mb|hz|khz|mah|h|hr|hrs|v|db|pk|pack|ct|oz|lb|x)$/;

/** The model code in a title: the longest word with both letters and digits ("WH-CH530", "P30i"), not a unit like "60W". */
export function modelCode(title: string): string | null {
  const words = title.split(/[\s,()/|]+/).map(norm).filter((w) => w.length >= 3 && /[a-z]/.test(w) && /\d/.test(w) && !UNIT.test(w));
  return words.sort((a, b) => b.length - a.length)[0] ?? null;
}

/** Same product at another store: same Channel3 product, or same brand and same model code. */
export function sameModel(a: Product, b: Product): boolean {
  if (a.productId && a.productId === b.productId) return true;
  const ka = modelCode(a.title);
  if (!ka || ka !== modelCode(b.title)) return false;
  return !a.brand || !b.brand || norm(a.brand) === norm(b.brand);
}

/** The same model at each store in `pool`: this product for its own store, the cheapest offer elsewhere; cheapest first. */
export function compareStores(product: Product, pool: Product[]) {
  const best = new Map<string, Product>([[product.merchant, product]]);
  for (const p of pool) {
    if (p.merchant === product.merchant || p.condition === 'used' || !sameModel(product, p)) continue;
    const seen = best.get(p.merchant);
    if (!seen || p.price < seen.price) best.set(p.merchant, p);
  }
  const stores = [...best.values()].sort((a, b) => a.price - b.price);
  const saved = stores.length > 1 ? Math.round((stores.at(-1)!.price - product.price) * 100) / 100 : null;
  return { stores, saved, cheapest: stores[0]! };
}

/** A cheaper new listing of the same model (any store, including the same one), if there is one. */
export const cheaperSameModel = (product: Product, pool: Product[]) =>
  pool.filter((p) => p.url !== product.url && p.condition !== 'used' && p.price < product.price && sameModel(product, p))
    .sort((a, b) => a.price - b.price)[0];

/**
 * How today's price compares with the 90-day history, from the numbers themselves:
 * low = at the 90-day low or 10%+ under the average; high = 10%+ over it; else typical.
 */
export function priceVerdict(price: number, h: { mean: number; min: number }): 'low' | 'typical' | 'high' {
  if (price <= h.min * 1.01 || price <= h.mean * 0.9) return 'low';
  if (price >= h.mean * 1.1) return 'high';
  return 'typical';
}

// ---------- 90-day price history (cached: it changes once a day) ----------

type History = NonNullable<Channel3Insight['history']>;
const HISTORY_TTL_MS = 6 * 60 * 60_000;
const histories = new Map<string, { at: number; value: History | null }>();

export async function priceHistory(productId: string | null | undefined): Promise<History | null> {
  if (!productId || !channel3Key()) return null;
  const hit = histories.get(productId);
  if (hit && Date.now() - hit.at < HISTORY_TTL_MS) return hit.value;
  const value = await c3(`/v0/price-tracking/history/${encodeURIComponent(productId)}?days=90`)
    .then((h: any): History | null => {
      const s = h?.statistics;
      if (!s || !['low', 'typical', 'high'].includes(s.current_status)) return null;
      return { status: s.current_status, mean: round(s.mean), min: round(s.min_price), max: round(s.max_price), days: (h.history ?? []).length || 90 };
    })
    .catch((err: Error) => {
      console.warn('Channel3 price history failed:', err.message.slice(0, 160));
      return null;
    });
  histories.set(productId, { at: Date.now(), value });
  return value;
}

const round = (n: unknown) => Math.round(Number(n) * 100) / 100;

/** Everything Channel3 says about one candidate, as saved with the option / purchase request. */
export async function insightFor(product: Product, pool: Product[]): Promise<Channel3Insight | undefined> {
  if (product.source !== 'channel3') return undefined;
  const { stores, saved } = compareStores(product, pool);
  const history = await priceHistory(product.productId);
  return {
    product_id: product.productId ?? null,
    image: product.image ?? null,
    brand: product.brand ?? null,
    stores: stores.slice(0, 5).map((s) => ({ merchant: s.merchant, price: s.price, was: s.wasPrice ?? null, url: s.url })),
    saved: saved && saved > 0 ? saved : null,
    history: history ? { ...history, status: priceVerdict(product.price, history) } : null,
  };
}

/**
 * Autopilot waits instead of buying when today's price is clearly above normal (10%+ over its
 * 90-day average in Channel3's history), unless the vault ends within 2 days.
 */
export function shouldWaitForPrice(price: number, history: History | null | undefined, expiresAt: string | Date): boolean {
  if (!history || priceVerdict(price, history) !== 'high') return false;
  return new Date(expiresAt).getTime() - Date.now() > 2 * 86_400_000;
}

/** "Lowest of 90 days", "$12 above its 90-day average", ... */
export function historyText(price: number, h: History | null | undefined): string | null {
  if (!h) return null;
  const status = priceVerdict(price, h);
  if (status === 'low') return price <= h.min ? `Lowest price in ${h.days} days (avg $${h.mean.toFixed(2)})` : `Below its ${h.days}-day average ($${h.mean.toFixed(2)})`;
  if (status === 'high') return `$${(price - h.mean).toFixed(2)} above its ${h.days}-day average ($${h.mean.toFixed(2)})`;
  return `A typical price for the last ${h.days} days (avg $${h.mean.toFixed(2)})`;
}

/** "BestBuy $48.00 · Walmart $52.00 · Target $55.00" */
export const storesText = (stores: { merchant: string; price: number }[]) => stores.map((s) => `${s.merchant} $${s.price.toFixed(2)}`).join(' · ');
