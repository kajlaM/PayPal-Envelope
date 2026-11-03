import { toCents, type Policy, type ShoppingItem, type ShoppingPrefs } from './schema.ts';

// Shopping-list vaults: what each item may cost right now. Pure functions, used by the Policy
// Engine (to enforce), the agent (to search within it) and the API (to show progress).

export type ItemProgress = {
  id: string;
  name: string;
  maxPriceCents: number; // the item's own limit
  spentCents: number; // paid or being paid for this item
  bought: boolean;
  limitCents: number; // what it may cost now (0 once bought)
};

export const listItems = (policy: Policy): ShoppingItem[] => policy.shopping?.list?.items ?? [];

/**
 * `spentCents`: per item id, money spent on it (payments that did not fail). With LEFTOVER, an item
 * still to buy may use the vault balance minus the limits of the other items still to buy, so every
 * other item keeps its own limit. It never gets less than its own limit (if the balance allows).
 */
export function itemProgress(policy: Policy, balanceCents: number, spentCents: Record<string, number>): ItemProgress[] {
  const items = listItems(policy);
  const bought = (i: ShoppingItem) => (spentCents[i.id] ?? 0) > 0;
  const openTotal = items.filter((i) => !bought(i)).reduce((sum, i) => sum + toCents(i.max_price), 0);
  const leftover = policy.shopping?.list?.rebalance !== 'NONE';
  return items.map((i) => {
    const own = toCents(i.max_price);
    const isBought = bought(i);
    const others = openTotal - (isBought ? 0 : own);
    const limit = isBought ? 0 : Math.min(balanceCents, leftover ? Math.max(own, balanceCents - others) : own);
    return { id: i.id, name: i.name, maxPriceCents: own, spentCents: spentCents[i.id] ?? 0, bought: isBought, limitCents: Math.max(0, limit) };
  });
}

/** The search preferences for one item: the item's own, the vault's for anything the item leaves unset. */
export function itemPrefs(prefs: ShoppingPrefs, item: ShoppingItem): ShoppingPrefs {
  return {
    ...prefs,
    product_query: item.product_query,
    required_keywords: item.required_keywords,
    preferred_keywords: item.preferred_keywords.length ? item.preferred_keywords : prefs.preferred_keywords,
    condition: item.condition ?? prefs.condition,
    min_rating: item.min_rating ?? prefs.min_rating,
    max_delivery_days: item.max_delivery_days ?? prefs.max_delivery_days,
  };
}
