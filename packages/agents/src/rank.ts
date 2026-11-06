import { isCategoryAllowed, type ShoppingPrefs } from '@paypalvault/policy';
import type { Product } from './search.ts';

// Deterministic product filter + ranking (no AI). Hard rules drop a product; the user's weights
// rank the rest. With the default weights (price only) the cheapest product comes first.

export type RejectReason =
  | 'OVER_BUDGET'
  | 'MERCHANT_NOT_APPROVED'
  | 'CATEGORY_NOT_ALLOWED'
  | 'USED'
  | 'WRONG_MODEL'
  | 'LOW_RATING'
  | 'SLOW_DELIVERY';

export type Candidate = Product & { score: number };
export type Rejected = { title: string; merchant: string; price: number; reason: RejectReason };

export type RankContext = {
  prefs: ShoppingPrefs;
  cap: number; // dollars: min(max_single_transaction, vault balance)
  approvedMerchants: string[];
  allowedCategories: string[];
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const hasWord = (title: string, word: string) => norm(title).includes(norm(word));

/** Most specific category in the product's path that the policy allows (else the most specific one). */
export function pickCategory(path: string[], allowed: string[], fallback = 'Electronics'): string {
  for (let i = path.length - 1; i >= 0; i--) if (isCategoryAllowed(path[i]!, allowed)) return path[i]!;
  return path.at(-1) ?? fallback;
}

function rejectReason(p: Product, ctx: RankContext): RejectReason | null {
  const { prefs } = ctx;
  if (p.price > ctx.cap) return 'OVER_BUDGET';
  if (!ctx.approvedMerchants.some((m) => m.toLowerCase() === p.merchant.toLowerCase())) return 'MERCHANT_NOT_APPROVED';
  if (p.categoryPath.length && !p.categoryPath.some((c) => isCategoryAllowed(c, ctx.allowedCategories))) return 'CATEGORY_NOT_ALLOWED';
  if (prefs.condition === 'NEW' && p.condition === 'used') return 'USED';
  if (!prefs.required_keywords.every((w) => hasWord(p.title, w))) return 'WRONG_MODEL';
  // Unknown rating / delivery time passes the hard rule, but scores in the middle.
  if (prefs.min_rating !== undefined && p.rating !== null && p.rating < prefs.min_rating) return 'LOW_RATING';
  if (prefs.max_delivery_days !== undefined && p.deliveryDays !== null && p.deliveryDays > prefs.max_delivery_days) return 'SLOW_DELIVERY';
  return null;
}

/** 1 for the best value in the list, 0 for the worst; 0.5 when unknown. */
function scale(value: number | null, values: (number | null)[], lowerIsBetter: boolean) {
  if (value === null) return 0.5;
  const known = values.filter((v): v is number => v !== null);
  const min = Math.min(...known);
  const max = Math.max(...known);
  if (max === min) return 1;
  const s = (value - min) / (max - min);
  return lowerIsBetter ? 1 - s : s;
}

export function rankProducts(products: Product[], ctx: RankContext): { candidates: Candidate[]; rejected: Rejected[] } {
  const seen = new Set<string>();
  const kept: Product[] = [];
  const rejected: Rejected[] = [];
  for (const p of products) {
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    const reason = rejectReason(p, ctx);
    if (reason) rejected.push({ title: p.title, merchant: p.merchant, price: p.price, reason });
    else kept.push(p);
  }

  const w = ctx.prefs.weights;
  const total = w.price + w.rating + w.delivery + w.model_match || 1;
  const preferred = ctx.prefs.preferred_keywords;
  const candidates = kept.map((p) => {
    const s =
      w.price * scale(p.price, kept.map((k) => k.price), true) +
      w.rating * (p.rating === null ? 0.5 : p.rating / 5) +
      w.delivery * scale(p.deliveryDays, kept.map((k) => k.deliveryDays), true) +
      w.model_match * (preferred.length ? preferred.filter((k) => hasWord(p.title, k)).length / preferred.length : 0);
    return { ...p, score: Math.round((s / total) * 1000) / 1000 };
  });

  candidates.sort((a, b) => b.score - a.score || a.price - b.price || (b.rating ?? 0) - (a.rating ?? 0));
  return { candidates, rejected };
}
