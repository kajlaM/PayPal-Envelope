import type { ProposalOption, SpendRequest } from '@kubepay/policy';
import { apiUrl, internalKey } from './config.ts';

// The agents' only link to money: the KubePay API. They never call PayPal payouts directly.

async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

export type VaultView = {
  id: string;
  name: string;
  type: 'SHOPPING' | 'UTILITY' | 'SAVINGS';
  status: string;
  balanceCents: number;
  policy: any;
  proposals?: { status: string; itemId: string | null; options: { url: string }[] }[];
  /** Shopping-list vaults: each item's limit now, and whether it is bought or waits for the owner. */
  items?: { id: string; name: string; limitCents: number; bought: boolean; waiting: 'OPTIONS' | 'APPROVAL' | null }[];
};

export async function getVault(vaultId: string): Promise<VaultView> {
  const { status, json } = await call('GET', `/api/vaults/${vaultId}`);
  if (status !== 200) throw new Error(`Vault ${vaultId} not found (${status})`);
  return json;
}

export async function listMerchants(): Promise<{ name: string; category: string; domain: string | null }[]> {
  return (await call('GET', '/api/merchants')).json;
}

/** POST /api/vaults/:id/spend. The Policy Engine decides; a payout happens only on APPROVE. */
export async function requestPurchase(vaultId: string, request: SpendRequest) {
  const { status, json } = await call('POST', `/api/vaults/${vaultId}/spend`, request, { 'x-internal-key': internalKey() });
  if (!json.decision) throw new Error(`Spend API failed (${status}): ${JSON.stringify(json)}`);
  return {
    result: json.decision.result as 'APPROVE' | 'BLOCK' | 'NEEDS_HUMAN',
    reasons: json.decision.reasons as string[],
    decisionId: json.decision.id as string,
    payoutStatus: (json.payout?.batchStatus ?? json.checkout?.captureStatus) as string | undefined,
  };
}

/** POST /api/vaults/:id/proposals. Ask me vaults: the owner picks one of these; nothing is bought here. */
export async function proposeOptions(vaultId: string, body: { item_id?: string; summary?: string; options: ProposalOption[] }) {
  const { status, json } = await call('POST', `/api/vaults/${vaultId}/proposals`, body, { 'x-internal-key': internalKey() });
  if (status !== 201) throw new Error(`Proposal API failed (${status}): ${JSON.stringify(json)}`);
  return json as { id: string };
}
