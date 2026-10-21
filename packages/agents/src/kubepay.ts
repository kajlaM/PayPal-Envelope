import type { SpendRequest } from '@kubepay/policy';
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
  type: 'SHOPPING' | 'UTILITY';
  status: string;
  balanceCents: number;
  policy: any;
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
    payoutStatus: json.payout?.batchStatus as string | undefined,
  };
}
