// Turns decisions and ledger entries into plain sentences. These sentences are what the audit search
// (keyword + semantic) matches against, so "why was it too expensive?" finds MAX_LIMIT_EXCEEDED.

export const REASON_TEXT: Record<string, string> = {
  VAULT_INACTIVE: 'the vault was not active (not funded yet, or closed)',
  VAULT_EXPIRED: 'the vault had expired',
  MAX_LIMIT_EXCEEDED: 'the amount was above the per-purchase limit',
  INSUFFICIENT_VAULT_BALANCE: 'the vault did not have enough money left',
  MERCHANT_NOT_APPROVED: 'the merchant is not on the approved list',
  MERCHANT_NOT_REGISTERED: 'the merchant is not registered with KubePay',
  CATEGORY_NOT_ALLOWED: 'the product category is not allowed in this vault',
  DAILY_LIMIT_REACHED: 'the daily number of purchases was reached',
  PRICE_MISMATCH: 'the live price on the shop page was different from the price asked (possible overcharge)',
  INVOICE_REQUIRED: 'a bill payment needs an invoice id',
  INVOICE_NOT_FOUND: 'the invoice does not exist',
  INVOICE_NOT_OPEN: 'the invoice was already paid or cancelled',
  INVOICE_MISMATCH: 'the amount did not match the invoice total',
  INVOICE_MERCHANT_MISMATCH: 'the invoice was not issued by this merchant',
  ABOVE_HUMAN_APPROVAL_THRESHOLD: 'the amount is above the limit that needs a human to approve',
  PRICE_NOT_VERIFIED: 'the price could not be checked on the shop page',
  POSSIBLE_DUPLICATE: 'the same purchase was made a few minutes earlier (possible duplicate)',
  UNUSUAL_SPEND: 'the purchase looks unusual compared with past spending in this vault',
  SYSTEM_ERROR: 'a system error stopped the payment before any money moved',
  REJECTED_BY_HUMAN: 'the vault owner rejected it',
};

const usd = (dollars: number) => `$${dollars.toFixed(2)}`;

export type DecisionInput = {
  id: string;
  vaultId: string;
  vaultName: string;
  vaultType: string;
  result: 'APPROVE' | 'BLOCK' | 'NEEDS_HUMAN';
  reasons: string[];
  resolvedBy: string | null;
  request: { merchant: string; amount: number; category: string; reason: string; invoice_id?: string; product_url?: string };
  createdAt: Date;
};

export type LedgerInput = {
  id: string;
  vaultId: string;
  vaultName: string;
  vaultType: string;
  type: 'FUND' | 'SPEND' | 'LIQUIDATE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amountCents: number;
  merchant: string | null;
  note: string | null;
  decisionId: string | null;
  updatedAt: Date;
};

export function describeDecision(d: DecisionInput): string {
  const r = d.request;
  const what = `payment of ${usd(r.amount)} to ${r.merchant} for "${r.reason}" (category ${r.category}${r.invoice_id ? `, invoice ${r.invoice_id}` : ''}) from vault "${d.vaultName}"`;
  const verb = d.result === 'APPROVE' ? 'Approved' : d.result === 'BLOCK' ? 'Blocked' : 'Held for human approval:';
  const why = d.reasons.length
    ? ` Because ${d.reasons.map((c) => `${REASON_TEXT[c] ?? c} (${c})`).join('; ')}.`
    : ' All policy checks passed.';
  const human =
    d.resolvedBy === 'APPROVED_BY_HUMAN' ? ' The vault owner approved it.' : d.resolvedBy === 'REJECTED_BY_HUMAN' ? ' The vault owner rejected it.' : '';
  return `${verb} ${what}.${why}${human}`;
}

export function describeLedger(e: LedgerInput): string {
  const amount = usd(e.amountCents / 100);
  const vault = `vault "${e.vaultName}"`;
  const to = e.merchant ? ` to ${e.merchant}` : '';
  switch (`${e.type}:${e.status}`) {
    case 'FUND:PENDING': return `Funding of ${amount} for ${vault} started; waiting for the owner to approve in PayPal.`;
    case 'FUND:COMPLETED': return `Vault "${e.vaultName}" was funded with ${amount}.`;
    case 'FUND:FAILED': return `Funding of ${amount} for ${vault} failed: ${e.note ?? 'not captured'}.`;
    case 'SPEND:PENDING': return `Payout of ${amount}${to} from ${vault} sent; waiting for PayPal to confirm.`;
    case 'SPEND:COMPLETED': return `Paid ${amount}${to} from ${vault}; the PayPal payout succeeded.`;
    case 'SPEND:FAILED': return `Payout of ${amount}${to} failed and the money went back to ${vault}: ${e.note ?? ''}`.trim();
    case 'LIQUIDATE:PENDING': return `Refund of the unused ${amount} from ${vault} to the owner sent; waiting for PayPal.`;
    case 'LIQUIDATE:COMPLETED': return `Refunded the unused ${amount} from ${vault} to the owner; the vault is closed.`;
    case 'LIQUIDATE:FAILED': return `Refund of ${amount} from ${vault} failed and the money stays in the vault: ${e.note ?? ''}`.trim();
    default: return `${e.type} ${e.status} ${amount} ${vault}`;
  }
}
