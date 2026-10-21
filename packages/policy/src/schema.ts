import { z } from 'zod';

// Shared contract between the API (Step 5), the Policy Compiler (Step 6) and the Policy Engine (Step 7).
// Amounts here are dollars, because people read and write policies. The database stores cents.

const weight = z.number().min(0).max(5);

/**
 * How the shopping agent picks a product (Step 8). Hard rules drop a product; weights (0-5) rank
 * the rest. Default weights are price only, so the cheapest matching product is tried first.
 */
export const ShoppingPrefsSchema = z.object({
  product_query: z.string().min(2).max(200), // what to look for, e.g. "wireless over-ear headphones"
  required_keywords: z.array(z.string()).default([]), // all must be in the title, else WRONG_MODEL
  preferred_keywords: z.array(z.string()).default([]), // nice to have, ranked by weights.model_match
  condition: z.enum(['NEW', 'ANY']).default('NEW'), // NEW drops used/refurbished items
  min_rating: z.number().min(0).max(5).optional(),
  max_delivery_days: z.number().int().positive().optional(),
  weights: z
    .object({ price: weight.default(5), rating: weight.default(0), delivery: weight.default(0), model_match: weight.default(0) })
    .default({ price: 5, rating: 0, delivery: 0, model_match: 0 }),
  check_every_minutes: z.number().int().min(15).max(1440).default(180), // watch mode: look again this often until expiry
});
export type ShoppingPrefs = z.infer<typeof ShoppingPrefsSchema>;

export const PolicySchema = z.object({
  vault_name: z.string().min(1).max(80),
  vault_type: z.enum(['SHOPPING', 'UTILITY']),
  allocated_budget: z.number().positive().max(10_000),
  currency: z.literal('USD').default('USD'),
  rules: z.object({
    max_single_transaction: z.number().positive(),
    allowed_categories: z.array(z.string()).min(1),
    approved_merchants: z.array(z.string()).min(1),
    expiry_timestamp: z.iso.datetime({ offset: true }),
    max_transactions_per_day: z.number().int().positive().optional(),
    human_approval_above: z.number().positive().optional(),
    on_policy_violation: z.enum(['BLOCK', 'BLOCK_AND_ALERT']).default('BLOCK_AND_ALERT'),
  }),
  liquidation: z
    .object({ auto_refund: z.boolean().default(true) })
    .default({ auto_refund: true }),
  shopping: ShoppingPrefsSchema.optional(), // SHOPPING vaults only
});
export type Policy = z.infer<typeof PolicySchema>;

/** What an agent sends when it wants to pay. */
export const SpendRequestSchema = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  reason: z.string().min(1).max(500),
  product_url: z.url().optional(),
  verified_price: z.number().positive().optional(), // from Kernel (Step 8)
  invoice_id: z.string().optional(), // utility vault (Step 8)
});
export type SpendRequest = z.infer<typeof SpendRequestSchema>;

export type DecisionResult = 'APPROVE' | 'BLOCK' | 'NEEDS_HUMAN';
export type Decision = { result: DecisionResult; reasons: string[] };

export const toCents = (dollars: number) => Math.round(dollars * 100);
