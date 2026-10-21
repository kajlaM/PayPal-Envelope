import { tool } from 'ai';
import { z } from 'zod';
import { ShoppingPrefsSchema } from '@kubepay/policy';
import { getVault, listMerchants, requestPurchase } from './kubepay.ts';
import { pickCategory, rankProducts, type Candidate, type Rejected } from './rank.ts';
import { runAgent, type AgentStep } from './runner.ts';
import { searchProducts, type Product } from './search.ts';
import { verifyListing } from './verify.ts';

export type ShoppingOutcome = 'BOUGHT' | 'NEEDS_HUMAN' | 'NO_MATCH';

/**
 * Shopping agent (Vault A).
 * 1. find_candidates: search approved shops; code drops products that break the user's rules and
 *    ranks the rest by the user's weights (cheapest first by default).
 * 2. skip_candidates: the model may skip products that are clearly the wrong item, with a reason.
 * 3. buy_next: code takes the next candidate in ranked order, verifies the live price, and asks the
 *    Policy Engine to buy it. The model never picks the price, merchant, or order.
 * If nothing can be bought, the outcome is NO_MATCH and watch mode looks again later.
 */
export async function runShoppingAgent(input: { vaultId: string; task?: string; onStep?: (s: AgentStep) => void }) {
  const vault = await getVault(input.vaultId);
  if (vault.type !== 'SHOPPING') throw new Error('The shopping agent only runs in a SHOPPING vault');
  const rules = vault.policy.rules;
  const prefs = vault.policy.shopping ?? ShoppingPrefsSchema.parse({ product_query: input.task || vault.name });
  const cap = Math.min(rules.max_single_transaction, vault.balanceCents / 100);
  const approved = new Set<string>(rules.approved_merchants.map((m: string) => m.toLowerCase()));
  const merchants = (await listMerchants()).filter((m) => approved.has(m.name.toLowerCase()));
  const rankCtx = { prefs, cap, approvedMerchants: rules.approved_merchants, allowedCategories: rules.allowed_categories };

  const pool = new Map<string, Product>();
  let ranked: Candidate[] = [];
  let rejected: Rejected[] = [];
  const tried = new Set<string>();
  const skipped = new Map<string, string>();
  let outcome: ShoppingOutcome = 'NO_MATCH';
  let spent = false;

  const view = (c: Candidate, i: number) => ({
    rank: i + 1, title: c.title, merchant: c.merchant, price: c.price, rating: c.rating,
    delivery_days: c.deliveryDays, condition: c.condition, score: c.score, url: c.url,
  });
  const open = () => ranked.filter((c) => !tried.has(c.url) && !skipped.has(c.url));

  const tools = {
    find_candidates: tool({
      description:
        'Search approved shops. Returns products that pass the user rules, best first, plus how many were dropped and why. You may call it again with a different query.',
      inputSchema: z.object({ query: z.string().min(2).optional().describe(`Defaults to "${prefs.product_query}"`) }),
      execute: async ({ query }) => {
        const found = await searchProducts(query ?? prefs.product_query, { maxPrice: cap, newOnly: prefs.condition === 'NEW', merchants });
        for (const p of found) pool.set(p.url, p);
        ({ candidates: ranked, rejected } = rankProducts([...pool.values()], rankCtx));
        const dropped: Record<string, number> = {};
        for (const r of rejected) dropped[r.reason] = (dropped[r.reason] ?? 0) + 1;
        return { budget_cap: cap, candidates: open().slice(0, 10).map(view), dropped };
      },
    }),
    skip_candidates: tool({
      description:
        'Skip candidates that are clearly not what the user wants (accessory, wrong product type). Skip all of them in one call, each with a short reason.',
      inputSchema: z.object({ skip: z.array(z.object({ url: z.string(), reason: z.string().min(3) })).min(1) }),
      execute: async ({ skip }) => {
        const known = skip.filter((s) => ranked.some((c) => c.url === s.url));
        for (const s of known) skipped.set(s.url, s.reason);
        return { skipped: known.length, unknown: skip.length - known.length, next: open()[0] ? view(open()[0]!, 0) : null };
      },
    }),
    buy_next: tool({
      description:
        'Verify the live price of the best remaining candidate and ask KubePay to buy it. If BLOCKed, call again to try the next one.',
      inputSchema: z.object({}),
      execute: async () => {
        if (outcome !== 'NO_MATCH') return { error: 'ALREADY_DONE', outcome };
        const next = open()[0];
        if (!next) return { done: true, message: 'NO_CANDIDATES_LEFT' };
        tried.add(next.url);

        const listing = await verifyListing(next.url).catch((err: Error) => ({ price: null, error: err.message }));
        spent = true;
        const decision = await requestPurchase(vault.id, {
          merchant: next.merchant,
          amount: next.price,
          category: pickCategory(next.categoryPath, rules.allowed_categories),
          reason: next.title,
          product_url: next.url,
          verified_price: listing.price ?? undefined,
        });
        if (decision.result === 'APPROVE') outcome = 'BOUGHT';
        if (decision.result === 'NEEDS_HUMAN') outcome = 'NEEDS_HUMAN';
        return { product: view(next, 0), live_price: listing.price, decision, remaining: open().length };
      },
    }),
  };

  const system = [
    'You are the KubePay shopping agent. You spend from one vault, and only through buy_next.',
    `Vault "${vault.name}": balance $${(vault.balanceCents / 100).toFixed(2)}, max $${rules.max_single_transaction} per purchase.`,
    `The user wants: ${prefs.product_query}.`,
    'Steps: 1) find_candidates. If the list looks like the wrong products, try one better query.',
    '2) skip_candidates (one call for all) only for items that are clearly not what the user wants (e.g. a cable when they want headphones).',
    '3) buy_next. If it is BLOCKed, call buy_next again for the next candidate. Stop at APPROVE, NEEDS_HUMAN, or NO_CANDIDATES_LEFT.',
    'Finish with a 2-3 line summary for the vault owner: what was bought, or why nothing matched yet.',
  ].join('\n');

  const run = await runAgent({
    system,
    prompt: input.task || `Buy: ${prefs.product_query}`,
    tools,
    hasSpent: () => spent,
    onStep: input.onStep,
    maxSteps: 16,
  });
  return {
    ...run,
    vaultId: vault.id,
    agent: 'shopping' as const,
    outcome,
    checked: { candidates: ranked.length, tried: tried.size, skipped: skipped.size, rejected: rejected.length },
  };
}
