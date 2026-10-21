import { isCategoryAllowed } from './categories.ts';
import { toCents, type Decision, type Policy, type SpendRequest } from './schema.ts';

// Policy Engine (Step 7): deterministic checks only. The LLM never decides.
// Pure function: the API gathers the context (ledger history, invoice, anomaly score) and passes it in,
// so every rule is unit tested without a database or PayPal.

export type VaultSnapshot = {
  type: 'SHOPPING' | 'UTILITY';
  status: string;
  balanceCents: number;
  expiresAt: Date;
};

export type EngineContext = {
  /** Spends (not failed) from this vault in the last 24 hours. */
  recentSpends: { merchant: string; amountCents: number; at: Date }[];
  /** Registered merchant the request names, or null if not registered. */
  merchant: { name: string; category: string } | null;
  /** Utility vaults: the PayPal invoice named by request.invoice_id. */
  invoice?: {
    found: boolean;
    status?: string;
    amountCents?: number;
    issuedByMerchant?: boolean;
    alreadyPaid?: boolean;
  };
  /** 0 (normal) .. 1 (very unusual), from Elastic (Step 11). */
  anomalyScore?: number;
};

/** Hard reasons always block. Soft reasons send the payment to a human instead. */
export const SOFT_REASONS = [
  'ABOVE_HUMAN_APPROVAL_THRESHOLD',
  'PRICE_NOT_VERIFIED',
  'POSSIBLE_DUPLICATE',
  'UNUSUAL_SPEND',
] as const;

const ANOMALY_THRESHOLD = 0.8;
const DUPLICATE_WINDOW_MS = 10 * 60_000;
const OPEN_INVOICE = ['SENT', 'UNPAID', 'PARTIALLY_PAID', 'SCHEDULED'];

export function evaluate(
  vault: VaultSnapshot,
  policy: Policy,
  req: SpendRequest,
  ctx: EngineContext,
  opts: { now?: Date; ignoreSoft?: boolean } = {},
): Decision {
  const now = opts.now ?? new Date();
  const hard: string[] = [];
  const soft: string[] = [];
  const amountCents = toCents(req.amount);
  const { rules } = policy;
  const lower = (list: string[]) => list.map((s) => s.toLowerCase());

  // 1. Vault state
  if (vault.status !== 'ACTIVE') hard.push('VAULT_INACTIVE');
  if (vault.expiresAt <= now) hard.push('VAULT_EXPIRED');

  // 2-3. Money
  if (amountCents > toCents(rules.max_single_transaction)) hard.push('MAX_LIMIT_EXCEEDED');
  if (amountCents > vault.balanceCents) hard.push('INSUFFICIENT_VAULT_BALANCE');

  // 4. Merchant: allowed by the policy AND registered with a PayPal account
  if (!lower(rules.approved_merchants).includes(req.merchant.toLowerCase())) hard.push('MERCHANT_NOT_APPROVED');
  else if (!ctx.merchant) hard.push('MERCHANT_NOT_REGISTERED');

  // 5. Category ("Audio" is allowed when the policy allows "Electronics")
  if (!isCategoryAllowed(req.category, rules.allowed_categories)) hard.push('CATEGORY_NOT_ALLOWED');

  // 6. Daily limit
  if (rules.max_transactions_per_day !== undefined && ctx.recentSpends.length >= rules.max_transactions_per_day) {
    hard.push('DAILY_LIMIT_REACHED');
  }

  // 7. Price check (shopping): the agent must pay exactly what Kernel saw on the page
  if (vault.type === 'SHOPPING') {
    if (req.verified_price === undefined) soft.push('PRICE_NOT_VERIFIED');
    else if (toCents(req.verified_price) !== amountCents) hard.push('PRICE_MISMATCH');
  }

  // 8. Invoice check (utility): pay only open bills from the merchant, for the exact amount, once
  if (vault.type === 'UTILITY') {
    const inv = ctx.invoice;
    if (!req.invoice_id) hard.push('INVOICE_REQUIRED');
    else if (!inv?.found) hard.push('INVOICE_NOT_FOUND');
    else {
      if (inv.alreadyPaid || !OPEN_INVOICE.includes(inv.status ?? '')) hard.push('INVOICE_NOT_OPEN');
      if (inv.amountCents !== amountCents) hard.push('INVOICE_MISMATCH');
      if (!inv.issuedByMerchant) hard.push('INVOICE_MERCHANT_MISMATCH');
    }
  }

  // 9. Same merchant + same amount in the last 10 minutes: agent may be looping
  const duplicate = ctx.recentSpends.some(
    (s) =>
      s.merchant.toLowerCase() === req.merchant.toLowerCase() &&
      s.amountCents === amountCents &&
      now.getTime() - s.at.getTime() < DUPLICATE_WINDOW_MS,
  );
  if (duplicate) soft.push('POSSIBLE_DUPLICATE');

  // 10. Unusual compared with this vault's history (Elastic, Step 11)
  if ((ctx.anomalyScore ?? 0) >= ANOMALY_THRESHOLD) soft.push('UNUSUAL_SPEND');

  // 11. Human approval threshold
  if (rules.human_approval_above !== undefined && amountCents > toCents(rules.human_approval_above)) {
    soft.push('ABOVE_HUMAN_APPROVAL_THRESHOLD');
  }

  if (hard.length > 0) return { result: 'BLOCK', reasons: hard };
  if (soft.length > 0 && !opts.ignoreSoft) return { result: 'NEEDS_HUMAN', reasons: soft };
  return { result: 'APPROVE', reasons: [] };
}
