import {
  apiProductsLookupRequestSchema, apiVaultsAgentNextRequestSchema, apiVaultsAgentRequestSchema, apiVaultsCompileRequestSchema,
  apiVaultsExpiryRequestSchema, apiVaultsFundCaptureRequestSchema, apiVaultsFundRecordedRequestSchema,
  apiVaultsFundRequestsRequestSchema, apiVaultsPolicyRequestSchema, apiVaultsProposalsChooseRequestSchema, apiVaultsRequestSchema,
  apiVaultsSavingsNextRequestSchema, PayPalVaultApiClient, vaultDetailsSchema, vaultSummarySchema, vaultVerificationSchema,
} from 'pay-pal-vault-api';

// The site's link to the PayPalVault API, through its APIMatic-generated SDK (packages/vault-sdk,
// built from apps/api/openapi/paypalvault.openapi.json). The API is private: only this site and
// PayPalVault's own agent call it.
//
// The SDK's models use camelCase; the API and this site speak the API's JSON as is. So each request
// is decoded into the SDK's model and each response encoded back with the SDK's own schemas: the JSON
// on the wire and in server.ts is exactly what it was with plain fetch (checked on every stored vault,
// policy and purchase request). An error answer becomes PayPalVaultError(status, body), as before.

export class PayPalVaultError extends Error {
  constructor(public status: number, public body: Record<string, unknown>) {
    super(String(body.message ?? body.error ?? `PayPalVault API answered ${status}`));
  }
}

let sdk: PayPalVaultApiClient | undefined;
const client = () => (sdk ??= new PayPalVaultApiClient({
  internalKey: process.env.INTERNAL_API_KEY?.trim(), // sent only to the operations that need it
  serverOptions: { baseUrl: (process.env.PAYPALVAULT_API_URL?.trim() || `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, '') },
  retry: { timeout: 180_000 }, // AI rule writing and Channel3 lookups can take a while; POSTs are never retried
}));

type Codec = { encode(value: unknown): unknown; decode(value: unknown): unknown };
type Result = { ok: true; value: unknown } | { ok: false; status: number; payload: unknown; message: string };

/** The API's JSON body as the SDK's request model. A shape the API would refuse is a 400, as before. */
function input<T>(codec: Codec, value: unknown): T {
  try {
    return codec.decode(value) as T;
  } catch (err) {
    throw new PayPalVaultError(400, { error: 'INVALID_INPUT', message: (err as Error).message.slice(0, 300) });
  }
}

/** Runs one SDK call; returns the API's JSON (encoded back when the SDK modelled it). */
async function run(call: (c: PayPalVaultApiClient) => { asApiResult(): Promise<unknown> }, codec?: Codec, many = false): Promise<any> {
  const result = (await call(client()).asApiResult()) as Result;
  if (!result.ok) throw new PayPalVaultError(result.status, errorBody(result.payload, result.message));
  if (!codec) return result.value;
  return many ? (result.value as unknown[]).map((v) => codec.encode(v)) : codec.encode(result.value);
}

function errorBody(payload: unknown, message: string): Record<string, unknown> {
  const p = payload as { body?: unknown; rawBody?: ArrayBuffer } | undefined;
  if (p?.body && typeof p.body === 'object') return p.body as Record<string, unknown>;
  if (p?.rawBody) {
    try { return JSON.parse(new TextDecoder().decode(p.rawBody)); } catch { /* not JSON */ }
  }
  return { error: 'PAYPALVAULT_API_ERROR', message };
}

export const vaultApi = {
  // Vaults
  listVaults: () => run((c) => c.vaults.listVaults(), vaultSummarySchema, true),
  listVaultDetails: (userId: string) => run((c) => c.vaults.listVaultDetails({ userId }), vaultDetailsSchema, true),
  getVault: (id: string) => run((c) => c.vaults.getVault({ id }), vaultDetailsSchema),
  compilePolicy: (text: unknown) => run((c) => c.vaults.compilePolicy({ body: input(apiVaultsCompileRequestSchema, { text }) })),
  createVault: (body: unknown) => run((c) => c.vaults.createVault({ body: input(apiVaultsRequestSchema, body) })),
  changePolicy: (id: string, body: unknown) => run((c) => c.vaults.changePolicy({ id, body: input(apiVaultsPolicyRequestSchema, body) })),
  changeExpiry: (id: string, expiresAt: unknown) => run((c) => c.vaults.changeExpiry({ id, body: input(apiVaultsExpiryRequestSchema, { expiresAt }) })),
  liquidate: (id: string) => run((c) => c.vaults.liquidateVault({ id })),

  // Funding
  createFundingOrder: (id: string) => run((c) => c.funding.createFundingOrder({ id })),
  captureFunding: (id: string, orderId: string) => run((c) => c.funding.captureFunding({ id, body: input(apiVaultsFundCaptureRequestSchema, { orderId }) })),
  recordFunding: (id: string, orderId: string) => run((c) => c.funding.recordFunding({ id, body: input(apiVaultsFundRecordedRequestSchema, { orderId }) })),
  createFundRequest: (id: string, body: unknown) => run((c) => c.funding.createFundRequest({ id, body: input(apiVaultsFundRequestsRequestSchema, body) })),
  syncFundRequests: (id: string) => run((c) => c.funding.syncFundRequests({ id })),
  cancelFundRequest: (id: string, requestId: string) => run((c) => c.funding.cancelFundRequest({ id, requestId })),
  listFundRequests: (payerEmail: string, status?: 'OPEN' | 'PAID' | 'CANCELLED') => run((c) => c.funding.listFundRequests({ payerEmail, ...(status ? { status } : {}) } as never)),
  syncFundRequest: (requestId: string) => run((c) => c.funding.syncFundRequest({ id: requestId })),

  // Purchases: the owner's answers (the agent's own requests go through packages/agents)
  approvePurchase: (id: string, decisionId: string) => run((c) => c.purchases.approvePurchase({ id, decisionId })),
  rejectPurchase: (id: string, decisionId: string) => run((c) => c.purchases.rejectPurchase({ id, decisionId })),
  chooseOption: (id: string, proposalId: string, index: unknown) => run((c) => c.purchases.chooseOption({ id, proposalId, body: input(apiVaultsProposalsChooseRequestSchema, { index }) })),
  rejectOptions: (id: string, proposalId: string) => run((c) => c.purchases.rejectOptions({ id, proposalId })),

  // The vault's own AI agent
  runAgent: (id: string) => run((c) => c.agent.runAgent({ id, body: input(apiVaultsAgentRequestSchema, {}) })),
  stopAgent: (id: string) => run((c) => c.agent.stopAgent({ id })),
  scheduleAgent: (id: string, at: unknown) => run((c) => c.agent.scheduleAgent({ id, body: input(apiVaultsAgentNextRequestSchema, { at }) })),

  // Savings
  chargeSavingsNow: (id: string) => run((c) => c.savingsApi.chargeSavingsNow({ id })),
  moveSavingsPayment: (id: string, at: unknown) => run((c) => c.savingsApi.moveSavingsPayment({ id, body: input(apiVaultsSavingsNextRequestSchema, { at }) })),
  pauseSavings: (id: string) => run((c) => c.savingsApi.pauseSavings({ id })),
  resumeSavings: (id: string) => run((c) => c.savingsApi.resumeSavings({ id })),

  // Verified by PayPal (read-only) and Channel3
  verifyVault: (id: string) => run((c) => c.payPalVerification.verifyVault({ id }), vaultVerificationSchema),
  lookupProduct: (url: string) => run((c) => c.products.lookupProduct({ body: input(apiProductsLookupRequestSchema, { url }) })),
};
