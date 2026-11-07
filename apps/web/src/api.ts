import {
  apiVaultsRequestSchema,
  decisionSchema,
  ledgerEntrySchema,
  PayPalVaultApiClient,
  PayPalVaultApiError,
  vaultDetailsSchema,
  vaultSummarySchema,
} from 'pay-pal-vault-api';
import type { AgentRun, CompileResult, CopilotAnswer, Decision, LedgerEntry, Policy, Proposal, Vault } from './types.ts';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// The dashboard talks to the API only through the generated SDK (packages/vault-sdk).
// No internalKey on purpose: every call made here is public, and the key must never reach a browser.
const client = new PayPalVaultApiClient({ serverOptions: { baseUrl: API_URL } });

/** An error the API answered with; `code` is the API's `error` field, e.g. "POLICY_NOT_UNDERSTOOD". */
export class ApiError extends Error {
  constructor(public status: number, public code: string, public body: Record<string, unknown>) {
    super(code);
  }
}

function errorBody(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  if ('body' in payload && payload.body && typeof payload.body === 'object') return payload.body as Record<string, unknown>;
  if ('rawBody' in payload && payload.rawBody instanceof ArrayBuffer) {
    try {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(payload.rawBody));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Runs one SDK call; API error statuses come back as ApiError so the UI reads them as before. */
async function call<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof PayPalVaultApiError && err.kind === 'api') {
      const body = errorBody(err.payload);
      throw new ApiError(err.status, typeof body.error === 'string' ? body.error : `HTTP ${err.status}`, body);
    }
    throw err;
  }
}

// The SDK decodes responses into its own models (camelCase keys, Date objects). The dashboard works on the
// API's JSON shapes in types.ts, so typed responses are encoded back to wire form here. Untyped map
// responses are already plain JSON.
const wire = <T>(schema: { encode: (value: unknown) => unknown }, value: unknown) => schema.encode(value) as T;
const wireList = <T>(schema: { encode: (value: unknown) => unknown }, values: readonly unknown[]) =>
  values.map((v) => schema.encode(v)) as T[];
const json = <T>(value: unknown) => value as T;

/** A short message for the UI, e.g. "POLICY_NOT_UNDERSTOOD: no budget given". */
export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.body.message ?? (Array.isArray(err.body.reasons) ? err.body.reasons.join(', ') : undefined);
    return detail ? `${err.code}: ${detail}` : err.code;
  }
  return err instanceof Error ? err.message : String(err);
}

export const api = {
  vaults: () => call(async () => wireList<Vault>(vaultSummarySchema, await client.vaults.listVaults())),
  vault: (id: string) =>
    call(async () => wire<Vault & { proposals: Proposal[] }>(vaultDetailsSchema, await client.vaults.getVault({ id }))),
  decisions: () => call(async () => wireList<Decision>(decisionSchema, await client.system.listDecisions())),
  ledger: () => call(async () => wireList<LedgerEntry>(ledgerEntrySchema, await client.system.listLedger())),

  compile: (text: string) => call(async () => json<CompileResult>(await client.vaults.compilePolicy({ body: { text } }))),
  // The policy is in API (wire) form; decode it into the SDK's model before sending. An incomplete policy
  // is stopped here, before anything is sent.
  createVault: (policy: Policy, sourceText?: string) =>
    call(async () => {
      let body;
      try {
        body = apiVaultsRequestSchema.decode(sourceText ? { policy, sourceText } : { policy });
      } catch (err) {
        const detail = (err as Error).message.replace(/^.*?decoded\.\s*/, '');
        throw new Error(`The policy is incomplete: ${detail}`);
      }
      return json<Vault>(await client.vaults.createVault({ body }));
    }),

  fundOrder: (id: string) => call(async () => json<{ orderId: string }>(await client.funding.createFundingOrder({ id }))),
  fundCapture: (id: string, orderId: string) =>
    call(async () => json<Vault>(await client.funding.captureFunding({ id, body: { orderId } }))),
  subscribe: (id: string) =>
    call(async () => json<{ planId: string; customId: string }>(await client.funding.createSubscription({ id }))),
  subscribeConfirm: (id: string, subscriptionId: string) =>
    call(() => client.funding.confirmSubscription({ id, body: { subscriptionId } })),

  runAgent: (id: string, task?: string) =>
    call(async () => json<AgentRun>(await client.agent.runAgent({ id, body: task ? { task } : {} }))),
  stopAgent: (id: string) => call(() => client.agent.stopAgent({ id })),
  approve: (vaultId: string, decisionId: string) => call(() => client.purchases.approvePurchase({ id: vaultId, decisionId })),
  reject: (vaultId: string, decisionId: string) => call(() => client.purchases.rejectPurchase({ id: vaultId, decisionId })),
  chooseOption: (vaultId: string, proposalId: string, index: number) =>
    call(async () =>
      json<{ decision: Decision }>(await client.purchases.chooseOption({ id: vaultId, proposalId, body: { index } })),
    ),
  rejectOptions: (vaultId: string, proposalId: string) =>
    call(() => client.purchases.rejectOptions({ id: vaultId, proposalId })),
  liquidate: (id: string) => call(() => client.vaults.liquidateVault({ id })),
  sync: (id: string) => call(() => client.vaults.syncVault({ id })),

  ask: (question: string, vaultId?: string) =>
    call(async () => json<CopilotAnswer>(await client.audit.askAudit({ body: vaultId ? { question, vaultId } : { question } }))),
};
