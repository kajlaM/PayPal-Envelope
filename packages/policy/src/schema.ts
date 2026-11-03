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

/** One item of a shopping-list vault ("laptop ≤ $600"). Unset preferences come from the vault's. */
export const ShoppingItemSchema = z.object({
  id: z.string().min(1).max(40), // stable across rule versions, so progress is kept
  name: z.string().min(1).max(80),
  product_query: z.string().min(2).max(200),
  max_price: z.number().positive(), // dollars
  required_keywords: z.array(z.string()).default([]),
  preferred_keywords: z.array(z.string()).default([]),
  condition: z.enum(['NEW', 'ANY']).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  max_delivery_days: z.number().int().positive().optional(),
});
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

/**
 * Shopping-list vaults: several items, each with its own limit, inside the vault total.
 *   LEFTOVER (default)  money an item did not use (and any unplanned money) can raise the limit of
 *                       the items still to buy, as long as every other item keeps its own limit
 *   NONE                every item stays at its own limit
 */
export const ShoppingListSchema = z.object({
  items: z.array(ShoppingItemSchema).min(2).max(10),
  rebalance: z.enum(['LEFTOVER', 'NONE']).optional(),
});

/**
 * How much the owner hands over to the agent (one setting per vault):
 *   ASK_ME     the agent proposes its top 3 options and the owner picks one; nothing is bought alone
 *   ASK_ABOVE  buys alone up to rules.human_approval_above, asks above it (no threshold: never asks)
 *   AUTOPILOT  buys alone within the rules
 * Safety flags (unverified price, duplicate, unusual spend) still ask the owner in every mode.
 */
export const CONTROL_MODES = ['ASK_ME', 'ASK_ABOVE', 'AUTOPILOT'] as const;

/**
 * Paying into a vault over time: `amount_per_payment` is taken from the owner's saved PayPal account
 * every `every`, the first one when the vault is created, until the vault holds allocated_budget.
 * A SAVINGS vault only saves; a SHOPPING vault saves first and its agent shops once the goal is reached.
 */
export const SAVINGS_INTERVALS = ['DAY', 'WEEK', 'MONTH'] as const;
export const SavingsPlanSchema = z.object({
  amount_per_payment: z.number().positive(),
  every: z.enum(SAVINGS_INTERVALS),
});
export type SavingsPlan = z.infer<typeof SavingsPlanSchema>;
export type ControlMode = (typeof CONTROL_MODES)[number];

export const PolicySchema = z.object({
  vault_name: z.string().min(1).max(80),
  vault_type: z.enum(['SHOPPING', 'UTILITY', 'SAVINGS']),
  allocated_budget: z.number().positive().max(10_000),
  currency: z.literal('USD').default('USD'),
  rules: z.object({
    max_single_transaction: z.number().positive(),
    allowed_categories: z.array(z.string()), // at least one, except in SAVINGS vaults (they never spend)
    approved_merchants: z.array(z.string()),
    expiry_timestamp: z.iso.datetime({ offset: true }),
    max_transactions_per_day: z.number().int().positive().optional(),
    human_approval_above: z.number().positive().optional(),
    on_policy_violation: z.enum(['BLOCK', 'BLOCK_AND_ALERT']).default('BLOCK_AND_ALERT'),
    control_mode: z.enum(CONTROL_MODES).optional(), // missing (vaults made before it existed): ASK_ABOVE
  }),
  liquidation: z
    .object({ auto_refund: z.boolean().default(true) })
    .default({ auto_refund: true }),
  shopping: ShoppingPrefsSchema.extend({ list: ShoppingListSchema.optional() }).optional(), // SHOPPING vaults only
  savings: SavingsPlanSchema.optional(), // pay in over time (required for SAVINGS vaults)
}).superRefine((policy, ctx) => {
  if (policy.vault_type !== 'SAVINGS') {
    if (policy.rules.allowed_categories.length === 0) ctx.addIssue({ code: 'custom', path: ['rules', 'allowed_categories'], message: 'Allow at least one category' });
    if (policy.rules.approved_merchants.length === 0) ctx.addIssue({ code: 'custom', path: ['rules', 'approved_merchants'], message: 'Approve at least one merchant' });
  }
  if (policy.vault_type === 'SAVINGS' && !policy.savings) ctx.addIssue({ code: 'custom', path: ['savings'], message: 'A savings vault needs a payment plan' });
  if (policy.vault_type === 'UTILITY' && policy.savings) ctx.addIssue({ code: 'custom', path: ['savings'], message: 'Bill vaults top up with a PayPal subscription instead' });
  if (policy.savings && policy.savings.amount_per_payment > policy.allocated_budget) {
    ctx.addIssue({ code: 'custom', path: ['savings', 'amount_per_payment'], message: 'Each payment must be at most the vault amount' });
  }
  const items = policy.shopping?.list?.items ?? [];
  const ids = new Set(items.map((i) => i.id));
  if (ids.size !== items.length) ctx.addIssue({ code: 'custom', path: ['shopping', 'list', 'items'], message: 'Item ids must be unique' });
  for (const [i, item] of items.entries()) {
    if (item.max_price > policy.allocated_budget) {
      ctx.addIssue({ code: 'custom', path: ['shopping', 'list', 'items', i, 'max_price'], message: `"${item.name}" costs more than the vault holds` });
    }
  }
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
  item_id: z.string().optional(), // shopping-list vault: which item this buys
});
export type SpendRequest = z.infer<typeof SpendRequestSchema>;

/** One of the agent's top options in an Ask me vault. The agent writes pros/cons; code picks the products. */
export const ProposalOptionSchema = z.object({
  title: z.string().min(1).max(300),
  merchant: z.string().min(1),
  price: z.number().positive(), // listed price, dollars
  verified_price: z.number().positive().nullable(), // live price read from the product page (null: unreadable)
  url: z.url(),
  category: z.string().min(1),
  rating: z.number().nullable().optional(),
  delivery_days: z.number().nullable().optional(),
  condition: z.string().nullable().optional(),
  pros: z.array(z.string().max(200)).max(5),
  cons: z.array(z.string().max(200)).max(5),
});
export type ProposalOption = z.infer<typeof ProposalOptionSchema>;

export const CreateProposalSchema = z.object({
  item_id: z.string().optional(),
  summary: z.string().max(1000).optional(),
  options: z.array(ProposalOptionSchema).min(1).max(3),
});

export type DecisionResult ='APPROVE' | 'BLOCK' | 'NEEDS_HUMAN';
export type Decision = { result: DecisionResult; reasons: string[] };

export const toCents = (dollars: number) => Math.round(dollars * 100);

export const controlMode = (policy: Policy): ControlMode => policy.rules.control_mode ?? 'ASK_ABOVE';
