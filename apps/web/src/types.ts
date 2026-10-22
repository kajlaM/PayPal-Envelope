// Shapes returned by the KubePay API (apps/api). Amounts in the database are cents; policies use dollars.

export type VaultType = 'SHOPPING' | 'UTILITY';
export type VaultStatus = 'PENDING_FUNDING' | 'ACTIVE' | 'EXPIRED' | 'LIQUIDATED';

export type Policy = {
  vault_name: string;
  vault_type: VaultType;
  allocated_budget: number;
  currency: 'USD';
  rules: {
    max_single_transaction: number;
    allowed_categories: string[];
    approved_merchants: string[];
    expiry_timestamp: string;
    max_transactions_per_day?: number;
    human_approval_above?: number;
    on_policy_violation: 'BLOCK' | 'BLOCK_AND_ALERT';
  };
  liquidation: { auto_refund: boolean };
  shopping?: { product_query: string; required_keywords: string[]; check_every_minutes: number; [key: string]: unknown };
};

export type Vault = {
  id: string;
  name: string;
  type: VaultType;
  budgetCents: number;
  balanceCents: number;
  status: VaultStatus;
  expiresAt: string;
  paypalSubscriptionId: string | null;
  nextAgentRunAt: string | null;
  lastAgentRunAt: string | null;
  lastAgentOutcome: string | null;
  createdAt: string;
  updatedAt: string;
  policy?: Policy;
};

export type SpendRequest = {
  merchant: string;
  amount: number;
  category: string;
  reason: string;
  product_url?: string;
  verified_price?: number;
  invoice_id?: string;
};

export type Decision = {
  id: string;
  vaultId: string;
  requestJson: SpendRequest;
  result: 'APPROVE' | 'BLOCK' | 'NEEDS_HUMAN';
  reasons: string[];
  resolvedBy: 'APPROVED_BY_HUMAN' | 'REJECTED_BY_HUMAN' | null;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  vaultId: string;
  type: 'FUND' | 'SPEND' | 'LIQUIDATE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amountCents: number;
  paypalRef: string | null;
  decisionId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { name: string } | null;
};

/** One tool call of a running agent (Socket.IO agent:step). */
export type AgentStep = { vaultId: string; tool: string; input: unknown; output: unknown; at: string };

export type AgentRun = { outcome?: string; summary?: string; model?: string };

export type CompileResult = { policy: Policy; warnings: string[]; model?: string };

export type AuditHit = { id: string; summary: string; timestamp: string; vaultId: string; result: string; decisionId?: string };
export type CopilotAnswer = { answer: string; sources: AuditHit[]; model: string | null };
