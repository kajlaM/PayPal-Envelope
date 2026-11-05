import type { ProposalOption } from '@kubepay/policy';
import type { Candidate } from './rank.ts';

// Ask me vaults: the facts behind each of the agent's top options, as pros and cons. Deterministic
// (no AI), so every option always has checkable reasons; the agent may add its own notes on top.

export type Prepared = Omit<ProposalOption, 'pros' | 'cons'> & { candidate: Candidate };

const stars = (n: number) => `${n.toFixed(1)}★`;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The same product listed twice (same name, shop and price under another URL): offered only once. */
export const sameListing = (a: { title: string; merchant: string; price: number }, b: { title: string; merchant: string; price: number }) =>
  norm(a.title) === norm(b.title) && a.merchant.toLowerCase() === b.merchant.toLowerCase() && a.price === b.price;

export function factsFor(option: Prepared, all: Prepared[], preferredKeywords: string[] = []) {
  const pros: string[] = [];
  const cons: string[] = [];
  const price = (o: Prepared) => o.verified_price ?? o.price;
  const prices = all.map(price);
  const ratings = all.map((o) => o.rating).filter((r): r is number => r != null);
  const days = all.map((o) => o.delivery_days).filter((d): d is number => d != null);
  const many = all.length > 1;

  if (many && price(option) === Math.min(...prices)) pros.push(`Lowest price of the ${all.length}`);
  if (many && price(option) === Math.max(...prices) && Math.min(...prices) < price(option)) cons.push(`Most expensive of the ${all.length}`);
  if (option.rating != null) {
    if (many && ratings.length > 1 && option.rating === Math.max(...ratings)) pros.push(`Best rated (${stars(option.rating)})`);
    else if (option.rating < 4) cons.push(`Rated only ${stars(option.rating)}`);
  } else cons.push('No rating yet');
  if (option.delivery_days != null) {
    if (many && days.length > 1 && option.delivery_days === Math.min(...days)) pros.push(`Fastest delivery (${option.delivery_days} days)`);
  }
  const title = option.title.toLowerCase();
  const matched = preferredKeywords.filter((k) => title.includes(k.toLowerCase()));
  if (matched.length) pros.push(`Has what you prefer: ${matched.join(', ')}`);
  // Channel3: stores compared and the 90-day price history
  const c3 = option.channel3;
  if (c3?.stores && c3.stores.length > 1) {
    const dearest = c3.stores.at(-1)!;
    if (c3.saved) pros.push(`Cheapest of ${c3.stores.length} stores ($${c3.saved.toFixed(2)} less than ${dearest.merchant})`);
    else if (c3.stores[0]!.merchant !== option.merchant) cons.push(`Cheaper at ${c3.stores[0]!.merchant} ($${c3.stores[0]!.price.toFixed(2)})`);
  }
  const was = c3?.stores?.find((s) => s.merchant === option.merchant)?.was;
  if (was && was > price(option)) pros.push(`On sale: was $${was.toFixed(2)}`);
  if (c3?.history) {
    const h = c3.history;
    if (h.status === 'low') pros.push(price(option) <= h.min ? `Lowest price in ${h.days} days` : `Below its ${h.days}-day average ($${h.mean.toFixed(2)})`);
    if (h.status === 'high') cons.push(`$${(price(option) - h.mean).toFixed(2)} above its ${h.days}-day average`);
  }
  if (option.condition === 'used') cons.push('Used or refurbished');
  if (option.verified_price === null) cons.push('Live price could not be checked: you will be asked again before paying');
  else if (option.verified_price !== option.price) cons.push(`Price changed on the shop page (was $${option.price.toFixed(2)})`);
  return { pros, cons };
}

/** The options as saved for the owner: facts first, then up to 2 of the agent's own notes for each. */
export function withProsAndCons(
  prepared: Prepared[],
  notes: Map<string, { pros: string[]; cons: string[] }>,
  preferredKeywords: string[] = [],
): ProposalOption[] {
  const merge = (a: string[], b: string[]) => [...new Set([...a, ...b.map((s) => s.trim().slice(0, 200)).filter(Boolean).slice(0, 2)])].slice(0, 5);
  return prepared.map((p) => {
    const facts = factsFor(p, prepared, preferredKeywords);
    const note = notes.get(p.url) ?? { pros: [], cons: [] };
    const { candidate: _, ...option } = p;
    return { ...option, pros: merge(facts.pros, note.pros), cons: merge(facts.cons, note.cons) };
  });
}
