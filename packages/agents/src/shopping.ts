import { tool } from 'ai';
import { z } from 'zod';
import { controlMode, itemPrefs, ShoppingPrefsSchema, type ControlMode, type ShoppingItem, type ShoppingPrefs } from '@paypalvault/policy';
import { getVault, listMerchants, proposeOptions, requestPurchase, type VaultView } from './paypalvault.ts';
import { sameListing, withProsAndCons, type Prepared } from './options.ts';
import { pickCategory, rankProducts, type Candidate, type Rejected } from './rank.ts';
import { runAgent, type AgentRun, type AgentStep } from './runner.ts';
import { searchProducts, type MerchantInfo, type Product } from './search.ts';
import { verifyListing } from './verify.ts';
import { cheaperSameModel, compareStores, historyText, insightFor, shouldWaitForPrice, storesText } from './channel3.ts';

/** WAITING_FOR_PRICE: everything that fits is priced well above its 90-day normal (Channel3); watch mode looks again. */
export type ShoppingOutcome = 'BOUGHT' | 'NEEDS_HUMAN' | 'PROPOSED' | 'NO_MATCH' | 'WAITING_FOR_PRICE';

const OPTIONS_TO_PROPOSE = 3;

/**
 * Shopping agent (Vault A).
 * 1. find_candidates: search approved shops; code drops products that break the user's rules and
 *    ranks the rest by the user's weights (cheapest first by default).
 * 2. skip_candidates: the model may skip products that are clearly the wrong item, with a reason.
 * 3. buy_next: code takes the next candidate in ranked order, verifies the live price, and asks the
 *    Policy Engine to buy it. The model never picks the price, merchant, or order.
 *    Ask me vaults never buy here: prepare_options verifies the top 3 and propose_options saves them,
 *    with pros and cons, for the owner to pick from.
 * If nothing can be bought, the outcome is NO_MATCH and watch mode looks again later.
 */
export async function runShoppingAgent(input: { vaultId: string; task?: string; onStep?: (s: AgentStep) => void }) {
  let vault = await getVault(input.vaultId);
  if (vault.type !== 'SHOPPING') throw new Error('The shopping agent only runs in a SHOPPING vault');
  const rules = vault.policy.rules;
  const prefs: ShoppingPrefs = vault.policy.shopping ?? ShoppingPrefsSchema.parse({ product_query: input.task || vault.name });
  const approved = new Set<string>(rules.approved_merchants.map((m: string) => m.toLowerCase()));
  const merchants = (await listMerchants()).filter((m) => approved.has(m.name.toLowerCase()));
  const mode = controlMode(vault.policy);
  const base = { merchants, mode, task: input.task, onStep: input.onStep };

  const list: ShoppingItem[] = vault.policy.shopping?.list?.items ?? [];
  if (list.length === 0) {
    const run = await shopFor({ ...base, vault, prefs, cap: Math.min(rules.max_single_transaction, vault.balanceCents / 100) });
    return { ...run, vaultId: vault.id, agent: 'shopping' as const };
  }

  // Shopping list: one search per item still to buy, in list order. After each purchase the vault is
  // read again, so leftover money raises the limits of the items that come next.
  const runs: { item: string; run: Awaited<ReturnType<typeof shopFor>> }[] = [];
  for (const item of list) {
    const state = vault.items?.find((i) => i.id === item.id);
    if (!state || state.bought || state.waiting) continue;
    const cap = Math.min(rules.max_single_transaction, state.limitCents / 100, vault.balanceCents / 100);
    if (cap <= 0) continue;
    const run = await shopFor({ ...base, vault, prefs: itemPrefs(prefs, item), cap, itemId: item.id, itemName: item.name });
    runs.push({ item: item.name, run });
    if (run.outcome === 'BOUGHT') vault = await getVault(vault.id);
  }
  vault = await getVault(vault.id);
  const left = (vault.items ?? []).filter((i) => !i.bought);
  // Keep watching while any item can still be searched for; stop when all are bought or wait for the owner.
  const outcome: ShoppingOutcome =
    left.length === 0 ? 'BOUGHT'
      : left.some((i) => !i.waiting) ? (runs.some((r) => r.run.outcome === 'WAITING_FOR_PRICE') ? 'WAITING_FOR_PRICE' : 'NO_MATCH')
        : left.some((i) => i.waiting === 'APPROVAL') ? 'NEEDS_HUMAN'
          : 'PROPOSED';
  return {
    summary: runs.map((r) => `${r.item}: ${r.run.summary}`).join('\n') || 'Every item is bought or waiting for you.',
    model: runs.at(-1)?.run.model ?? '',
    steps: runs.flatMap((r) => r.run.steps),
    vaultId: vault.id,
    agent: 'shopping' as const,
    outcome,
    items: runs.map((r) => ({ item: r.item, outcome: r.run.outcome })),
    checked: runs.reduce<Record<string, number>>((sum, r) => {
      for (const [k, n] of Object.entries(r.run.checked)) sum[k] = (sum[k] ?? 0) + n;
      return sum;
    }, {}),
  };
}

/** One agent run that looks for one thing (`prefs`) costing at most `cap` dollars. */
async function shopFor(input: {
  vault: VaultView;
  merchants: MerchantInfo[];
  prefs: ShoppingPrefs;
  cap: number;
  mode: ControlMode;
  itemId?: string;
  itemName?: string;
  task?: string;
  onStep?: (s: AgentStep) => void;
}): Promise<AgentRun & { outcome: ShoppingOutcome; checked: Record<string, number> }> {
  const { vault, prefs, cap, itemId } = input;
  const rules = vault.policy.rules;
  const askMe = input.mode === 'ASK_ME';
  const rankCtx = { prefs, cap, approvedMerchants: rules.approved_merchants, allowedCategories: rules.allowed_categories };

  const pool = new Map<string, Product>();
  let ranked: Candidate[] = [];
  let rejected: Rejected[] = [];
  const tried = new Set<string>();
  const skipped = new Map<string, string>();
  // Products the owner turned down in earlier options are never offered or bought again.
  for (const p of vault.proposals ?? []) {
    if (p.status === 'REJECTED' && (p.itemId ?? undefined) === itemId) for (const o of p.options) skipped.set(o.url, 'owner rejected it');
  }
  let outcome: ShoppingOutcome = 'NO_MATCH';
  let spent = false;
  const prepared: Prepared[] = [];
  const priceWaits: string[] = []; // candidates passed over because Channel3 says the price is unusually high

  const view = (c: Candidate, i: number) => ({
    rank: i + 1, title: c.title, merchant: c.merchant, price: c.price, rating: c.rating,
    delivery_days: c.deliveryDays, condition: c.condition, score: c.score, url: c.url,
  });
  const open = () => ranked.filter((c) => !tried.has(c.url) && !skipped.has(c.url));
  const category = (c: Candidate) => pickCategory(c.categoryPath, rules.allowed_categories);

  async function propose(notes: { url: string; pros: string[]; cons: string[] }[], summary?: string) {
    const options = withProsAndCons(prepared, new Map(notes.map((n) => [n.url, n])), prefs.preferred_keywords);
    const saved = await proposeOptions(vault.id, { item_id: itemId, summary: summary?.slice(0, 1000), options });
    outcome = 'PROPOSED';
    return { proposal_id: saved.id, options: options.map((o) => ({ title: o.title, price: o.verified_price ?? o.price, pros: o.pros, cons: o.cons })) };
  }

  const tools = {
    find_candidates: tool({
      description:
        'Search approved shops. Returns products that pass the user rules, best first, plus how many were dropped and why. You may call it again with a different query.',
      inputSchema: z.object({ query: z.string().min(2).optional().describe(`Defaults to "${prefs.product_query}"`) }),
      execute: async ({ query }) => {
        const found = await searchProducts(query ?? prefs.product_query, { maxPrice: cap, newOnly: prefs.condition === 'NEW', merchants: input.merchants });
        for (const p of found) pool.set(p.url, p);
        ({ candidates: ranked, rejected } = rankProducts([...pool.values()], rankCtx));
        // Compare stores (Channel3): the same model at a cheaper approved store wins; the dearer listing is skipped.
        let cheaperElsewhere = 0;
        for (const c of ranked) {
          const cheaper = cheaperSameModel(c, ranked);
          if (cheaper && !skipped.has(c.url)) {
            skipped.set(c.url, `same model is cheaper at ${cheaper.merchant} ($${cheaper.price.toFixed(2)})`);
            cheaperElsewhere++;
          }
        }
        const dropped: Record<string, number> = {};
        for (const r of rejected) dropped[r.reason] = (dropped[r.reason] ?? 0) + 1;
        if (cheaperElsewhere) dropped.SAME_MODEL_CHEAPER_AT_ANOTHER_STORE = cheaperElsewhere;
        return {
          budget_cap: cap,
          candidates: open().slice(0, 10).map((c, i) => {
            const { stores } = compareStores(c, ranked);
            return { ...view(c, i), ...(stores.length > 1 ? { compared_stores: storesText(stores) } : {}) };
          }),
          dropped,
        };
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
    ...(askMe ? askMeTools() : buyTools()),
  };

  function buyTools() {
    return {
      buy_next: tool({
        description:
          'Verify the live price of the best remaining candidate and ask PayPalVault to buy it. If BLOCKed, call again to try the next one.',
        inputSchema: z.object({}),
        execute: async () => {
          if (outcome !== 'NO_MATCH') return { error: 'ALREADY_DONE', outcome };
          const next = open()[0];
          if (!next) {
            if (priceWaits.length) outcome = 'WAITING_FOR_PRICE';
            return { done: true, message: priceWaits.length ? 'WAITING_FOR_BETTER_PRICE' : 'NO_CANDIDATES_LEFT', waiting_for_price: priceWaits };
          }
          tried.add(next.url);

          const channel3 = await insightFor(next, [...pool.values()]);
          if (vault.expiresAt && shouldWaitForPrice(next.price, channel3?.history, vault.expiresAt)) {
            priceWaits.push(`${next.title} ($${next.price.toFixed(2)})`);
            return {
              price_high: true,
              product: view(next, 0),
              price_history: historyText(next.price, channel3?.history),
              message: 'Not bought: this price is well above its 90-day normal (Channel3). Call buy_next again for the next candidate.',
              remaining: open().length,
            };
          }

          const listing = await verifyListing(next.url).catch((err: Error) => ({ price: null, error: err.message }));
          spent = true;
          const decision = await requestPurchase(vault.id, {
            merchant: next.merchant,
            amount: next.price,
            category: category(next),
            reason: next.title,
            product_url: next.url,
            verified_price: listing.price ?? undefined,
            ...(itemId ? { item_id: itemId } : {}),
            ...(channel3 ? { channel3 } : {}),
          });
          if (decision.result === 'APPROVE') outcome = 'BOUGHT';
          if (decision.result === 'NEEDS_HUMAN') outcome = 'NEEDS_HUMAN';
          return {
            product: view(next, 0),
            live_price: listing.price,
            ...(channel3?.stores && channel3.stores.length > 1 ? { compared_stores: storesText(channel3.stores) } : {}),
            ...(channel3?.history ? { price_history: historyText(next.price, channel3.history) } : {}),
            decision,
            remaining: open().length,
          };
        },
      }),
    };
  }

  function askMeTools() {
    return {
      prepare_options: tool({
        description: `Check the live price of the best ${OPTIONS_TO_PROPOSE} remaining candidates. Returns the options to write pros and cons for.`,
        inputSchema: z.object({}),
        execute: async () => {
          if (outcome !== 'NO_MATCH') return { error: 'ALREADY_DONE', outcome };
          const overCap: string[] = [];
          for (const c of open()) {
            if (prepared.length === OPTIONS_TO_PROPOSE) break;
            if (prepared.some((p) => sameListing(p.candidate, c))) {
              skipped.set(c.url, 'same product as another option');
              continue;
            }
            tried.add(c.url);
            const listing = await verifyListing(c.url).catch(() => ({ price: null }));
            if (listing.price !== null && listing.price > cap) {
              overCap.push(c.title); // the live price is above what this vault may pay
              continue;
            }
            const channel3 = await insightFor(c, [...pool.values()]);
            prepared.push({
              title: c.title, merchant: c.merchant, price: c.price, verified_price: listing.price, url: c.url,
              category: category(c), rating: c.rating, delivery_days: c.deliveryDays, condition: c.condition,
              ...(channel3 ? { channel3 } : {}), candidate: c,
            });
          }
          if (prepared.length === 0) return { done: true, message: 'NO_CANDIDATES_LEFT', dropped_live_price_too_high: overCap };
          return {
            options: prepared.map((p, i) => ({
              ...view(p.candidate, i),
              live_price: p.verified_price,
              ...(p.channel3?.stores && p.channel3.stores.length > 1 ? { compared_stores: storesText(p.channel3.stores) } : {}),
              ...(p.channel3?.history ? { price_history: historyText(p.verified_price ?? p.price, p.channel3.history) } : {}),
            })),
            dropped_live_price_too_high: overCap,
          };
        },
      }),
      propose_options: tool({
        description:
          'Save the prepared options for the owner to pick from, with 1-2 short pros and cons for each (compare them with each other). Call once.',
        inputSchema: z.object({
          summary: z.string().describe('1-2 lines for the owner: what you found and which one you would pick'),
          notes: z.array(z.object({ url: z.string(), pros: z.array(z.string()).max(2), cons: z.array(z.string()).max(2) })),
        }),
        execute: async ({ summary, notes }) => {
          if (prepared.length === 0) return { error: 'CALL_PREPARE_OPTIONS_FIRST' };
          if (outcome === 'PROPOSED') return { error: 'ALREADY_PROPOSED' };
          return propose(notes, summary);
        },
      }),
    };
  }

  const wants = `${prefs.product_query}${itemId ? ` (shopping-list item "${input.itemName}", max $${cap.toFixed(2)})` : ''}`;
  const system = askMe
    ? [
        'You are the PayPalVault shopping agent. In this vault the owner picks every purchase: you never buy.',
        `Vault "${vault.name}": you may suggest products up to $${cap.toFixed(2)}.`,
        `The user wants: ${wants}.`,
        'Steps: 1) find_candidates. If the list looks like the wrong products, try one better query.',
        '2) skip_candidates (one call for all) only for items that are clearly not what the user wants.',
        `3) prepare_options. 4) propose_options once, with 1-2 short, concrete pros and cons per option that help the owner choose.`,
        'Product data comes from Channel3: compared_stores shows the same model at each store, price_history its 90-day price. Use them in pros and cons.',
        'Finish with a 1-2 line summary for the vault owner.',
      ].join('\n')
    : [
        'You are the PayPalVault shopping agent. You spend from one vault, and only through buy_next.',
        `Vault "${vault.name}": balance $${(vault.balanceCents / 100).toFixed(2)}, max $${cap.toFixed(2)} for this purchase.`,
        `The user wants: ${wants}.`,
        'Steps: 1) find_candidates. If the list looks like the wrong products, try one better query.',
        '2) skip_candidates (one call for all) only for items that are clearly not what the user wants (e.g. a cable when they want headphones).',
        '3) buy_next. If it is BLOCKed or says price_high, call buy_next again for the next candidate. Stop at APPROVE, NEEDS_HUMAN, NO_CANDIDATES_LEFT or WAITING_FOR_BETTER_PRICE.',
        'Product data comes from Channel3: compared_stores shows the same model at each store, price_history its 90-day price.',
        'Finish with a 2-3 line summary for the vault owner: what was bought (mention the stores compared and the price history when known), or why nothing was bought yet.',
      ].join('\n');

  const run = await runAgent({
    system,
    prompt: (itemId ? undefined : input.task) || `${askMe ? 'Find options for' : 'Buy'}: ${prefs.product_query}`,
    tools,
    hasSpent: () => spent,
    onStep: input.onStep,
    maxSteps: 16,
  });
  // The model stopped before saving its options: save them with the facts as pros and cons.
  if (askMe && outcome === 'NO_MATCH' && prepared.length > 0) await propose([]);
  return {
    ...run,
    outcome,
    checked: { candidates: ranked.length, tried: tried.size, skipped: skipped.size, rejected: rejected.length },
  };
}
