import { generateObject } from 'ai';
import { z } from 'zod';
import { policyModels } from './model.ts';
import { PolicySchema, type Policy } from './schema.ts';

// Policy Compiler (Step 6): plain English -> policy JSON.
// The LLM only fills a draft. Code then fixes, clamps and validates it,
// and the user confirms the result before the vault is created.

/** What the LLM fills in. Kept simple (no defaults/formats) so every model supports it. */
export const PolicyDraftSchema = z.object({
  vault_name: z.string().describe('Short name for the vault, max 60 characters'),
  vault_type: z.enum(['SHOPPING', 'UTILITY']).describe('UTILITY for bills (electricity, water, internet), otherwise SHOPPING'),
  allocated_budget: z.number().describe('Total money in the vault, in US dollars'),
  max_single_transaction: z.number().nullable().describe('Max dollars for one payment, or null if not stated'),
  allowed_categories: z.array(z.string()).describe('Product categories, e.g. ["Electronics","Audio"] or ["Utilities"]'),
  approved_merchants: z.array(z.string()).describe('Merchants the user allows. Only names from the provided list'),
  expiry_timestamp: z.string().nullable().describe('When the vault ends, ISO 8601 with timezone offset, or null if not stated'),
  max_transactions_per_day: z.number().nullable().describe('Max payments per day, or null if not stated'),
  human_approval_above: z.number().nullable().describe('Payments above this many dollars need a human to approve, or null'),
  currency_mentioned: z.string().nullable().describe('Currency the user wrote (e.g. "USD", "INR"), or null'),
  // Shopping preferences (SHOPPING vaults only; null / [] when not stated)
  product_query: z.string().nullable().describe('Short product search text, e.g. "wireless over-ear headphones"'),
  required_keywords: z.array(z.string()).describe('Words that MUST be in the product name (exact brand/model the user insists on), else []'),
  preferred_keywords: z.array(z.string()).describe('Brands/features the user would like but does not insist on, else []'),
  allow_used: z.boolean().nullable().describe('true if used/refurbished is fine, false if new only, null if not stated'),
  min_rating: z.number().nullable().describe('Minimum star rating out of 5, or null'),
  max_delivery_days: z.number().nullable().describe('Must arrive within this many days, or null'),
  price_weight: z.number().nullable().describe('How much low price matters, 0-5, or null'),
  rating_weight: z.number().nullable().describe('How much a high rating matters, 0-5, or null'),
  delivery_weight: z.number().nullable().describe('How much fast delivery matters, 0-5, or null'),
  model_match_weight: z.number().nullable().describe('How much matching the preferred keywords matters, 0-5, or null'),
  check_every_minutes: z.number().nullable().describe('If nothing matches now, how often to look again, in minutes, or null'),
  assumptions: z.array(z.string()).describe('Short notes on anything you had to guess'),
});
export type PolicyDraft = z.infer<typeof PolicyDraftSchema>;

export type Merchant = { name: string; category: string };
export type CompileResult = { policy: Policy; warnings: string[]; model?: string };

const DAY = 86_400_000;
const MAX_BUDGET = 10_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

function systemPrompt(merchants: Merchant[], now: Date, timeZone: string) {
  return [
    'You convert a user request into a spending policy for a KubePay vault: a small, separate budget that an AI agent may spend.',
    'Only output the fields asked for. Never invent limits the user did not state; use null instead.',
    `Current time: ${now.toISOString()} (user time zone: ${timeZone}). Turn relative dates like "before Sunday" or "in 2 days" into an exact timestamp; "before <day>" means the end of the day before it, 23:59:59 in the user time zone.`,
    `Registered merchants (name - category): ${merchants.map((m) => `${m.name} - ${m.category}`).join('; ')}.`,
    'approved_merchants must only contain names from that list. If the user names no merchant, return the merchants whose category fits the request.',
    'All amounts are US dollars.',
    'For SHOPPING vaults also fill the shopping fields. Weights: 5 = matters most, 0 = ignore. If the user says e.g. "rating matters more than price", reflect that in the weights; otherwise leave them null.',
  ].join('\n');
}

/** Turns the LLM draft into a valid policy. Pure function, so it is unit tested without an LLM. */
export function normalizeDraft(draft: PolicyDraft, merchants: Merchant[], now = new Date()): CompileResult {
  const warnings = [...draft.assumptions];

  if (draft.currency_mentioned && draft.currency_mentioned.toUpperCase() !== 'USD') {
    throw new PolicyCompileError(`Only USD vaults are supported (you wrote ${draft.currency_mentioned}).`);
  }

  const budget = round2(draft.allocated_budget);
  if (!(budget > 0)) throw new PolicyCompileError('Say how much money the vault should hold.');
  if (budget > MAX_BUDGET) throw new PolicyCompileError(`A vault can hold at most $${MAX_BUDGET}.`);

  let maxTx = draft.max_single_transaction === null ? budget : round2(draft.max_single_transaction);
  if (draft.max_single_transaction === null) warnings.push(`No per-payment limit given: using the full budget ($${budget}).`);
  if (!(maxTx > 0) || maxTx > budget) {
    warnings.push(`Per-payment limit set to the budget ($${budget}).`);
    maxTx = budget;
  }

  // Keep only registered merchants, using their exact registry name.
  const byName = new Map(merchants.map((m) => [m.name.toLowerCase(), m.name]));
  const approved = [...new Set(draft.approved_merchants.map((n) => byName.get(n.trim().toLowerCase())).filter((n): n is string => !!n))];
  const unknown = draft.approved_merchants.filter((n) => !byName.has(n.trim().toLowerCase()));
  if (unknown.length) warnings.push(`Not registered, so removed: ${unknown.join(', ')}.`);

  const categories = [...new Set(draft.allowed_categories.map((c) => c.trim()).filter(Boolean))];
  if (draft.vault_type === 'UTILITY' && !categories.some((c) => c.toLowerCase() === 'utilities')) categories.push('Utilities');
  if (categories.length === 0) throw new PolicyCompileError('Say what the vault is for (e.g. headphones, electricity bill).');

  if (approved.length === 0) {
    const fallback = merchants.filter((m) => categories.some((c) => c.toLowerCase() === m.category.toLowerCase()));
    if (fallback.length === 0) throw new PolicyCompileError('No registered merchant sells this category.');
    approved.push(...fallback.map((m) => m.name));
    warnings.push(`No merchant named: allowing ${approved.join(', ')}.`);
  }

  let expiry = draft.expiry_timestamp ? new Date(draft.expiry_timestamp) : null;
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry <= now) {
    if (draft.expiry_timestamp) warnings.push('Expiry was missing or in the past: using 7 days from now.');
    else warnings.push('No end date given: the vault expires in 7 days.');
    expiry = new Date(now.getTime() + 7 * DAY);
  } else if (expiry.getTime() - now.getTime() > 90 * DAY) {
    warnings.push('Vaults last at most 90 days: expiry shortened.');
    expiry = new Date(now.getTime() + 90 * DAY);
  }

  const positiveOrUndefined = (n: number | null) => (n !== null && n > 0 ? n : undefined);
  const shopping = draft.vault_type === 'SHOPPING' ? shoppingPrefs(draft, warnings) : undefined;
  const policy = PolicySchema.parse({
    vault_name: draft.vault_name.trim().slice(0, 80) || 'My vault',
    vault_type: draft.vault_type,
    allocated_budget: budget,
    currency: 'USD',
    rules: {
      max_single_transaction: maxTx,
      allowed_categories: categories,
      approved_merchants: approved,
      expiry_timestamp: expiry.toISOString(),
      max_transactions_per_day: positiveOrUndefined(draft.max_transactions_per_day && Math.floor(draft.max_transactions_per_day)),
      human_approval_above: positiveOrUndefined(draft.human_approval_above && round2(draft.human_approval_above)),
      on_policy_violation: 'BLOCK_AND_ALERT',
    },
    liquidation: { auto_refund: true },
    shopping,
  });
  return { policy, warnings };
}

function shoppingPrefs(draft: PolicyDraft, warnings: string[]) {
  const clampWeight = (n: number | null, fallback: number) => (n === null ? fallback : Math.min(5, Math.max(0, Math.round(n))));
  const weights = {
    price: clampWeight(draft.price_weight, 5),
    rating: clampWeight(draft.rating_weight, draft.min_rating ? 1 : 0),
    delivery: clampWeight(draft.delivery_weight, 0),
    model_match: clampWeight(draft.model_match_weight, draft.preferred_keywords.length ? 2 : 0),
  };
  if (Object.values(weights).every((w) => w === 0)) weights.price = 5;

  const words = (list: string[]) => [...new Set(list.map((w) => w.trim()).filter(Boolean))];
  const every = draft.check_every_minutes === null ? 180 : Math.min(1440, Math.max(15, Math.round(draft.check_every_minutes)));
  if (draft.check_every_minutes !== null && every !== draft.check_every_minutes) warnings.push(`Check interval set to ${every} minutes.`);

  return {
    product_query: (draft.product_query?.trim() || draft.vault_name).slice(0, 200),
    required_keywords: words(draft.required_keywords),
    preferred_keywords: words(draft.preferred_keywords),
    condition: draft.allow_used ? ('ANY' as const) : ('NEW' as const),
    min_rating: draft.min_rating !== null && draft.min_rating > 0 ? Math.min(5, draft.min_rating) : undefined,
    max_delivery_days: draft.max_delivery_days !== null && draft.max_delivery_days > 0 ? Math.ceil(draft.max_delivery_days) : undefined,
    weights,
    check_every_minutes: every,
  };
}

export class PolicyCompileError extends Error {}

/** Plain English -> validated policy + warnings to show the user before they confirm. */
export async function compilePolicy(
  text: string,
  merchants: Merchant[],
  opts: { now?: Date; timeZone?: string } = {},
): Promise<CompileResult> {
  const now = opts.now ?? new Date();
  let lastError: unknown;
  for (const model of policyModels()) {
    try {
      const { object } = await generateObject({
        model,
        schema: PolicyDraftSchema,
        system: systemPrompt(merchants, now, opts.timeZone ?? 'Asia/Kolkata'),
        prompt: text,
        temperature: 0,
        maxRetries: 1,
      });
      return { ...normalizeDraft(object, merchants, now), model: model.modelId };
    } catch (err) {
      // The user's request itself is the problem: no other model will fix that.
      if (err instanceof PolicyCompileError) throw err;
      // Provider problem (no credits, overloaded, quota, bad output): try the next model.
      console.warn(`[policy] ${model.provider}/${model.modelId} failed: ${(err as Error).message.slice(0, 160)}`);
      lastError = err;
    }
  }
  throw new PolicyCompileError(`All AI models are unavailable right now, try again in a minute. (${(lastError as Error)?.message ?? ''})`);
}
