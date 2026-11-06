import { z } from 'zod';
import * as S from './api-schemas.ts';

// The OpenAPI 3.1 description ("blueprint") of the PayPalVault API, built from the same zod schemas
// the routes validate with (api-schemas.ts). It is PRIVATE: the API is only reachable by the
// PayPalVault site and PayPalVault's own AI agent, never by outside agents or tools.
// Written to apps/api/openapi/paypalvault.openapi.json by `npm run openapi -w @paypalvault/api`;
// APIMatic generates the private SDK and docs from that file (apimatic/).

type Json = Record<string, unknown>;

/** A zod schema as JSON Schema (request side: what the caller sends). Dates travel as ISO strings. */
function schema(zod: z.ZodType): Json {
  const json = z.toJSONSchema(zod, {
    io: 'input',
    unrepresentable: 'any',
    override: (ctx) => {
      if (ctx.zodSchema._zod.def.type === 'date') Object.assign(ctx.jsonSchema, { type: 'string', format: 'date-time' });
    },
  }) as Json;
  delete json.$schema;
  return simplify(json) as Json;
}

/**
 * Rewrites two JSON Schema forms into ones SDK generators read reliably (same validation):
 *   anyOf [{ type: X, ... }, { type: 'null' }]  ->  { type: [X, 'null'], ... }
 *   a [string, number] tuple (prefixItems)      ->  an array of exactly 2 strings or numbers
 */
function simplify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(simplify);
  if (!node || typeof node !== 'object') return node;
  const out: Json = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, simplify(v)]));
  const any = out.anyOf as Json[] | undefined;
  if (Array.isArray(any) && any.length === 2) {
    const nil = any.findIndex((s) => s.type === 'null' && Object.keys(s).length === 1);
    const other = any[1 - nil];
    if (nil >= 0 && other && typeof other.type === 'string') {
      delete out.anyOf;
      return { ...out, ...other, type: [other.type, 'null'] };
    }
  }
  if (Array.isArray(out.prefixItems)) {
    const types = [...new Set((out.prefixItems as Json[]).map((s) => s.type).filter((t): t is string => typeof t === 'string'))];
    const { prefixItems, items: _closed, ...rest } = out;
    return { ...rest, items: types.length === 1 ? { type: types[0] } : { type: types } };
  }
  return out;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (s: Json) => ({ content: { 'application/json': { schema: s } } });
const ok = (description: string, s: Json = ref('Object')) => ({ description, ...json(s) });
const err = { description: 'Error: { error: CODE, message? }', ...json(ref('Error')) };

type Op = {
  method: 'get' | 'post';
  path: string;
  id: string; // operationId: becomes the SDK method name
  tag: string;
  summary: string;
  description?: string;
  query?: z.ZodObject;
  body?: z.ZodType;
  agentOnly?: boolean; // needs x-internal-key (only PayPalVault's own site, agent and jobs have it)
  response?: Json;
  status?: Record<string, Json>;
};

const vaultId = { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Vault id' };
const pathParams = (path: string) =>
  [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => (name === 'id' ? vaultId : { name, in: 'path', required: true, schema: { type: 'string' } }));

const OPS: Op[] = [
  // ----- Vaults -----
  { method: 'get', path: '/api/vaults', id: 'listVaults', tag: 'Vaults', summary: 'All vaults with totals, Channel3 savings and their PayPal check summary', response: { type: 'array', items: ref('VaultSummary') } },
  { method: 'get', path: '/api/vaults/details', id: 'listVaultDetails', tag: 'Vaults', summary: 'Every vault of one customer with full details', query: S.VaultDetailsQuery, response: { type: 'array', items: ref('VaultDetails') } },
  { method: 'get', path: '/api/vaults/{id}', id: 'getVault', tag: 'Vaults', summary: 'One vault with its ledger, decisions, rule history, proposals and savings plan', response: ref('VaultDetails') },
  { method: 'post', path: '/api/vaults/compile', id: 'compilePolicy', tag: 'Vaults', summary: 'Plain English to vault rules (preview only; nothing is saved)', body: S.CompilePolicyBody, response: ref('Object') },
  { method: 'post', path: '/api/vaults', id: 'createVault', tag: 'Vaults', summary: 'Create a vault from reviewed rules (it waits for its money)', body: S.CreateVaultBody, status: { 201: ok('Created', ref('Object')) } },
  { method: 'post', path: '/api/vaults/{id}/policy', id: 'changePolicy', tag: 'Vaults', summary: 'Change an active vault\'s rules or amount (a new version; lower amount refunds the difference)', body: S.ChangePolicyBody },
  { method: 'post', path: '/api/vaults/{id}/expiry', id: 'changeExpiry', tag: 'Vaults', summary: 'Move the vault\'s end date', body: S.ExpiryBody },
  { method: 'post', path: '/api/vaults/{id}/liquidate', id: 'liquidateVault', tag: 'Vaults', summary: 'Close the vault and refund what is left to the owner\'s PayPal (Payouts)' },
  { method: 'post', path: '/api/vaults/{id}/sync', id: 'syncVault', tag: 'Vaults', summary: 'Ask PayPal again about pending payments of this vault' },

  // ----- Funding (money into a vault, always from PayPal) -----
  { method: 'post', path: '/api/vaults/{id}/fund/order', id: 'createFundingOrder', tag: 'Funding', summary: 'PayPal order for the PayPal button (the owner approves it on PayPal)' },
  { method: 'post', path: '/api/vaults/{id}/fund/capture', id: 'captureFunding', tag: 'Funding', summary: 'Capture the approved order: the vault gets its money', body: S.OrderIdBody },
  { method: 'post', path: '/api/vaults/{id}/fund/recorded', id: 'recordFunding', tag: 'Funding', summary: 'Record a payment the site took from the owner\'s saved PayPal', body: S.OrderIdBody, agentOnly: true },
  { method: 'post', path: '/api/vaults/{id}/fund/requests', id: 'createFundRequest', tag: 'Funding', summary: 'Ask a friend: a PayPal money request whose payment funds the vault', body: S.FundRequestBody },
  { method: 'post', path: '/api/vaults/{id}/fund/requests/sync', id: 'syncFundRequests', tag: 'Funding', summary: 'Ask PayPal whether the friend paid' },
  { method: 'post', path: '/api/vaults/{id}/fund/requests/{requestId}/cancel', id: 'cancelFundRequest', tag: 'Funding', summary: 'Cancel an open money request' },
  { method: 'get', path: '/api/fund-requests', id: 'listFundRequests', tag: 'Funding', summary: 'Money requests sent to one PayPal email', query: z.object({ payerEmail: z.string(), status: z.enum(['OPEN', 'PAID', 'CANCELLED']).optional() }), response: { type: 'array', items: ref('Object') } },
  { method: 'post', path: '/api/fund-requests/{id}/sync', id: 'syncFundRequest', tag: 'Funding', summary: 'Ask PayPal about one money request' },
  { method: 'post', path: '/api/vaults/{id}/subscribe', id: 'createSubscription', tag: 'Funding', summary: 'Utility vault: monthly PayPal subscription that tops it up' },
  { method: 'post', path: '/api/vaults/{id}/subscribe/confirm', id: 'confirmSubscription', tag: 'Funding', summary: 'Confirm the approved subscription', body: S.SubscriptionIdBody },

  // ----- Purchases: every payment out goes through the Policy Engine -----
  {
    method: 'post', path: '/api/vaults/{id}/spend', id: 'requestPurchase', tag: 'Purchases', agentOnly: true,
    summary: 'The agent ASKS to buy: the Policy Engine approves, blocks, or asks the owner',
    description: 'The only way money leaves a vault for a shop. The Policy Engine checks the vault rules (budget, shops, categories, limits, live price) first. 200 = approved and paid with PayPal; 202 = waits for the owner\'s approval; 403 = blocked.',
    body: S.SpendRequestSchema,
    status: { 200: ok('Approved and paid', ref('SpendResult')), 202: ok('Needs the owner\'s approval', ref('SpendResult')), 403: ok('Blocked by the rules', ref('SpendResult')) },
  },
  { method: 'post', path: '/api/vaults/{id}/decisions/{decisionId}/approve', id: 'approvePurchase', tag: 'Purchases', summary: 'The owner approves a waiting purchase (the hard rules are checked again first)', description: 'The site asks for the owner\'s password before calling this.' },
  { method: 'post', path: '/api/vaults/{id}/decisions/{decisionId}/reject', id: 'rejectPurchase', tag: 'Purchases', summary: 'The owner rejects a waiting purchase' },
  { method: 'post', path: '/api/vaults/{id}/proposals', id: 'proposeOptions', tag: 'Purchases', agentOnly: true, summary: 'The agent suggests up to 3 options; nothing is bought until the owner picks one', body: S.CreateProposalSchema, status: { 201: ok('Created', ref('Object')) } },
  { method: 'post', path: '/api/vaults/{id}/proposals/{proposalId}/choose', id: 'chooseOption', tag: 'Purchases', summary: 'The owner picks an option (it then goes through the Policy Engine)', body: S.ChooseOptionBody },
  { method: 'post', path: '/api/vaults/{id}/proposals/{proposalId}/reject', id: 'rejectOptions', tag: 'Purchases', summary: 'The owner wants none of the options' },

  // ----- PayPalVault's own AI agent -----
  { method: 'post', path: '/api/vaults/{id}/agent', id: 'runAgent', tag: 'Agent', summary: 'Run the vault\'s own AI agent now (it can only ask to buy, via requestPurchase)', body: S.AgentRunBody, status: { 202: ok('Started') } },
  { method: 'post', path: '/api/vaults/{id}/agent/stop', id: 'stopAgent', tag: 'Agent', summary: 'Stop watching this vault' },
  { method: 'post', path: '/api/vaults/{id}/agent/next', id: 'scheduleAgent', tag: 'Agent', summary: 'Move the agent\'s next check', body: S.WhenBody },

  // ----- Savings -----
  { method: 'post', path: '/api/vaults/{id}/savings/charge', id: 'chargeSavingsNow', tag: 'Savings', agentOnly: true, summary: 'Take the next savings payment now (from the owner\'s saved PayPal)' },
  { method: 'post', path: '/api/vaults/{id}/savings/next', id: 'moveSavingsPayment', tag: 'Savings', summary: 'Move the next savings payment (the later ones follow)', body: S.WhenBody },
  { method: 'post', path: '/api/vaults/{id}/savings/pause', id: 'pauseSavings', tag: 'Savings', summary: 'Pause the savings plan' },
  { method: 'post', path: '/api/vaults/{id}/savings/resume', id: 'resumeSavings', tag: 'Savings', summary: 'Resume the savings plan' },

  // ----- Verified by PayPal (read-only) -----
  {
    method: 'post', path: '/api/vaults/{id}/verify', id: 'verifyVault', tag: 'PayPal verification',
    summary: 'Check every payment of this vault against PayPal\'s own records',
    description: 'Read-only: PayPal is only asked, never paid, and the ledger\'s amounts and statuses are never changed. Also runs every night.',
    response: ref('VaultVerification'), status: { 429: err },
  },

  // ----- Products (Channel3) -----
  { method: 'post', path: '/api/products/lookup', id: 'lookupProduct', tag: 'Products', summary: 'A store\'s product link to the product, its stores and its 90-day price (Channel3)', body: S.ProductLookupBody, status: { 422: err } },

  // ----- Audit (Elastic) -----
  { method: 'get', path: '/api/audit/search', id: 'searchAudit', tag: 'Audit', summary: 'Search the audit log (keyword + meaning)', query: S.AuditSearchQuery, response: { type: 'array', items: ref('Object') } },
  { method: 'post', path: '/api/audit/ask', id: 'askAudit', tag: 'Audit', summary: 'Audit Copilot: a question in plain English, answered from cited audit records', body: S.AuditAskBody },
  { method: 'post', path: '/api/audit/reindex', id: 'reindexAudit', tag: 'Audit', agentOnly: true, summary: 'Rewrite every decision and payment into the audit log' },

  // ----- System -----
  { method: 'get', path: '/health', id: 'health', tag: 'System', summary: 'Is the API up?' },
  { method: 'get', path: '/api/merchants', id: 'listMerchants', tag: 'System', summary: 'Shops vaults may pay', response: { type: 'array', items: ref('Object') } },
  { method: 'get', path: '/api/ledger', id: 'listLedger', tag: 'System', summary: 'Latest ledger entries (optionally of one vault)', query: z.object({ vaultId: z.string().optional() }), response: { type: 'array', items: ref('LedgerEntry') } },
  { method: 'get', path: '/api/decisions', id: 'listDecisions', tag: 'System', summary: 'Latest Policy Engine decisions (optionally of one vault)', query: z.object({ vaultId: z.string().optional() }), response: { type: 'array', items: ref('Decision') } },
  { method: 'post', path: '/api/jobs/tick', id: 'runBackgroundJobs', tag: 'System', agentOnly: true, summary: 'Run the background jobs once (sweeper, savings, watch mode, nightly PayPal check)' },
];

/** The operations, for tests: every route the API serves must be described here. */
export const OPERATIONS = OPS.map(({ method, path }) => ({ method, path }));

const components = {
  securitySchemes: {
    InternalKey: { type: 'apiKey', in: 'header', name: 'x-internal-key', description: 'Only PayPalVault\'s own site, agent and background jobs have it. Never given to outside agents or tools.' },
  },
  schemas: {
    Object: { type: 'object', additionalProperties: true },
    Error: { type: 'object', required: ['error'], properties: { error: { type: 'string' }, message: { type: 'string' } }, additionalProperties: true },
    PayPalCheck: { type: 'string', enum: ['VERIFIED', 'WAITING', 'MISMATCH', 'UNCHECKED'], description: 'Last read-only check against PayPal\'s records' },
    LedgerEntry: {
      type: 'object', additionalProperties: true,
      properties: {
        id: { type: 'string' }, vaultId: { type: 'string' },
        type: { type: 'string', enum: ['FUND', 'SPEND', 'LIQUIDATE'] }, status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
        amountCents: { type: 'integer', minimum: 0 }, paypalRef: { type: ['string', 'null'] }, paidVia: { type: ['string', 'null'] },
        paypalCheck: { anyOf: [ref('PayPalCheck'), { type: 'null' }] }, paypalCheckedAt: { type: ['string', 'null'], format: 'date-time' },
        paypalTxnId: { type: ['string', 'null'] }, paypalCheckNote: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' },
      },
    },
    Decision: {
      type: 'object', additionalProperties: true,
      properties: {
        id: { type: 'string' }, vaultId: { type: 'string' }, requestJson: schema(S.SpendRequestSchema),
        result: { type: 'string', enum: ['APPROVE', 'BLOCK', 'NEEDS_HUMAN'] }, reasons: { type: 'array', items: { type: 'string' } },
        resolvedBy: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' },
      },
    },
    VaultSummary: {
      type: 'object', additionalProperties: true,
      properties: {
        id: { type: 'string' }, userId: { type: 'string' }, name: { type: 'string' },
        type: { type: 'string', enum: ['SHOPPING', 'UTILITY', 'SAVINGS'] }, status: { type: 'string', enum: ['PENDING_FUNDING', 'SAVING', 'ACTIVE', 'EXPIRED', 'LIQUIDATED'] },
        budgetCents: { type: 'integer' }, balanceCents: { type: 'integer' }, expiresAt: { type: 'string', format: 'date-time' },
        policy: schema(S.PolicySchema),
        totals: { type: 'object', properties: { paidInCents: { type: 'integer' }, spentCents: { type: 'integer' }, refundedCents: { type: 'integer' } } },
        channel3: { type: ['object', 'null'], properties: { storesCents: { type: 'integer' }, averageCents: { type: 'integer' }, purchases: { type: 'integer' } } },
        verification: {
          type: ['object', 'null'],
          properties: { verified: { type: 'integer' }, waiting: { type: 'integer' }, mismatch: { type: 'integer' }, unchecked: { type: 'integer' }, notYet: { type: 'integer' }, checkedAt: { type: 'string', format: 'date-time' } },
        },
      },
    },
    VaultDetails: {
      allOf: [ref('VaultSummary'), {
        type: 'object', additionalProperties: true,
        properties: {
          ledger: { type: 'array', items: ref('LedgerEntry') }, decisions: { type: 'array', items: ref('Decision') },
          policyHistory: { type: 'array', items: ref('Object') }, proposals: { type: 'array', items: ref('Object') },
          items: { type: 'array', items: ref('Object') }, fundRequests: { type: 'array', items: ref('Object') }, savings: { type: ['object', 'null'], additionalProperties: true },
        },
      }],
    },
    SpendResult: { type: 'object', additionalProperties: true, properties: { decision: ref('Decision'), ledgerEntry: { anyOf: [ref('LedgerEntry'), { type: 'null' }] } } },
    VaultVerification: {
      type: 'object',
      properties: {
        vaultId: { type: 'string' }, checkedAt: { type: 'string', format: 'date-time' },
        counts: { type: 'object', properties: { VERIFIED: { type: 'integer' }, WAITING: { type: 'integer' }, MISMATCH: { type: 'integer' }, UNCHECKED: { type: 'integer' } } },
        balanceMatches: { type: 'boolean' }, errors: { type: 'integer' },
        mismatches: { type: 'array', items: { type: 'object', properties: { entryId: { type: 'string' }, note: { type: 'string' } } } },
      },
    },
  },
};

export function buildOpenApi() {
  const paths: Record<string, Json> = {};
  for (const op of OPS) {
    const query = op.query
      ? Object.entries((schema(op.query).properties ?? {}) as Record<string, Json>).map(([name, s]) => ({
          name, in: 'query', required: ((schema(op.query!).required ?? []) as string[]).includes(name), schema: s,
        }))
      : [];
    (paths[op.path] ??= {})[op.method] = {
      operationId: op.id,
      tags: [op.tag],
      summary: op.summary,
      ...(op.description || op.agentOnly
        ? { description: [op.description, op.agentOnly ? 'Internal: needs the internal key (only PayPalVault\'s own site, agent and jobs have it).' : ''].filter(Boolean).join(' ') }
        : {}),
      parameters: [...pathParams(op.path), ...query],
      ...(op.body ? { requestBody: { required: true, ...json(schema(op.body)) } } : {}),
      // No key: only the PayPalVault site calls these, over the private network (the API is never exposed).
      security: op.agentOnly ? [{ InternalKey: [] }] : [],
      responses: {
        ...(op.status && Object.keys(op.status).some((code) => code.startsWith('2')) ? {} : { 200: ok('OK', op.response) }),
        ...op.status, 400: err, 404: err, 409: err, 502: err,
      },
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'PayPalVault API',
      version: '0.1.0',
      license: { name: 'Proprietary (private)' },
      description: [
        'PRIVATE API of PayPalVault: policy-limited PayPal vaults for one AI shopping agent.',
        '',
        'Safety rules, built into the API:',
        '- Only the PayPalVault site and PayPalVault\'s own AI agent call it. No outside agents or tools; it is not public.',
        '- The agent can only ASK to buy (requestPurchase). The Policy Engine decides; the owner approves with a password when the rules say so.',
        '- Money only moves through PayPal (sandbox): funding via Orders, purchases via Checkout or Payouts, refunds via Payouts.',
        '- Internal operations need the internal key (x-internal-key), which only PayPalVault itself holds.',
        '- "Verified by PayPal" (verifyVault) only reads from PayPal.',
      ].join('\n'),
    },
    servers: [{ url: 'http://localhost:4000', description: 'Private: the API is never exposed (the site forwards only what it needs)' }],
    tags: [
      { name: 'Vaults', description: 'Create, read, change and close vaults' },
      { name: 'Funding', description: 'Money into a vault, always from PayPal' },
      { name: 'Purchases', description: 'Every payment out goes through the Policy Engine' },
      { name: 'Agent', description: 'PayPalVault\'s own AI agent (no outside agents)' },
      { name: 'Savings', description: 'Vaults paid into over time' },
      { name: 'PayPal verification', description: 'Read-only check of every payment against PayPal\'s records' },
      { name: 'Products', description: 'Channel3 product data' },
      { name: 'Audit', description: 'Elastic audit log and Audit Copilot' },
      { name: 'System', description: 'Health, merchants, background jobs' },
    ],
    paths,
    components,
  };
}
