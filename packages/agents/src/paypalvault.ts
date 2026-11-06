import {
  apiVaultsProposalsRequestSchema, apiVaultsSpendRequestSchema, PayPalVaultApiClient, spendResultSchema, vaultDetailsSchema,
} from 'pay-pal-vault-api';
import type { ProposalOption, SpendRequest } from '@paypalvault/policy';
import { apiUrl, internalKey } from './config.ts';

// The agents' only link to money: the PayPalVault API, through its APIMatic-generated SDK
// (packages/vault-sdk, built from apps/api/openapi/paypalvault.openapi.json). The SDK client stays
// inside this file, and only these four calls leave it: look at a vault, list the shops, ASK to buy
// (the Policy Engine decides) and suggest options. The agents have no call that pays, approves,
// refunds or closes anything, and they never call PayPal directly.
//
// The SDK's models use camelCase; the API (and all agent code) speak its JSON as is. So requests are
// decoded into the SDK's models and responses encoded back with the SDK's own schemas: the JSON on
// the wire and in the agent code is exactly what it was before (checked on every stored policy,
// purchase request and vault).

let sdk: PayPalVaultApiClient | undefined;
const client = () => (sdk ??= new PayPalVaultApiClient({
  internalKey: internalKey(),
  serverOptions: { baseUrl: apiUrl() },
}));

export type VaultView = {
  id: string;
  name: string;
  type: 'SHOPPING' | 'UTILITY' | 'SAVINGS';
  status: string;
  balanceCents: number;
  expiresAt?: string | Date;
  policy: any;
  proposals?: { status: string; itemId: string | null; options: { url: string }[] }[];
  /** Shopping-list vaults: each item's limit now, and whether it is bought or waits for the owner. */
  items?: { id: string; name: string; limitCents: number; bought: boolean; waiting: 'OPTIONS' | 'APPROVAL' | null }[];
};

export async function getVault(vaultId: string): Promise<VaultView> {
  const result = await client().vaults.getVault({ id: vaultId }).asApiResult();
  if (!result.ok) throw new Error(`Vault ${vaultId} not found (${result.status})`);
  return vaultDetailsSchema.encode(result.value) as unknown as VaultView;
}

export async function listMerchants(): Promise<{ name: string; category: string; domain: string | null }[]> {
  return (await client().system.listMerchants()) as unknown as { name: string; category: string; domain: string | null }[];
}

/**
 * POST /api/vaults/:id/spend. The Policy Engine decides; a payment happens only on APPROVE.
 * 200 = approved and paid, 202 = waits for the owner, 403 = blocked: all three carry the decision.
 * The SDK never retries a POST, so a purchase request is never sent twice.
 */
export async function requestPurchase(vaultId: string, request: SpendRequest) {
  const result = await client().purchases.requestPurchase({ id: vaultId, body: apiVaultsSpendRequestSchema.decode(request) }).asApiResult();
  const answer = result.ok ? result.value : result.payload.kind === 'spendResult' ? result.payload.body : undefined;
  const body: any = answer ? spendResultSchema.encode(answer) : undefined;
  if (!body?.decision) throw new Error(`Spend API failed (${result.status}): ${result.ok ? 'no decision' : result.message}`);
  return {
    result: body.decision.result as 'APPROVE' | 'BLOCK' | 'NEEDS_HUMAN',
    reasons: body.decision.reasons as string[],
    decisionId: body.decision.id as string,
    payoutStatus: (body.payout?.batchStatus ?? body.checkout?.captureStatus) as string | undefined,
  };
}

/** POST /api/vaults/:id/proposals. Ask me vaults: the owner picks one of these; nothing is bought here. */
export async function proposeOptions(vaultId: string, body: { item_id?: string; summary?: string; options: ProposalOption[] }) {
  const result = await client().purchases.proposeOptions({ id: vaultId, body: apiVaultsProposalsRequestSchema.decode(body) }).asApiResult();
  if (!result.ok || result.status !== 201) throw new Error(`Proposal API failed (${result.status}): ${result.ok ? 'unexpected status' : result.message}`);
  return result.value as unknown as { id: string };
}
