<!-- Generated file — do not edit; regenerated with the SDK. -->

# System — operations

Accessor: `client.system` · Source: `src/resources/system.ts` · 5 operations · Request and error types: namespace `System`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### health

- **Signature**: `health(options?: RequestOptions): ApiPromise<Record<string, unknown>, System.HealthError>`
- **Wire**: `GET /health`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `System.HealthError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listDecisions

- **Signature**: `listDecisions(request?: System.ListDecisionsRequest, options?: RequestOptions): ApiPromise<Decision[], System.ListDecisionsError>`
- **Wire**: `GET /api/decisions`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Decision[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `System.ListDecisionsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `System.ListDecisionsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `vaultId` | `query` | `string` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Decision` | `decisionSchema` | `src/models/decision.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listLedger

- **Signature**: `listLedger(request?: System.ListLedgerRequest, options?: RequestOptions): ApiPromise<LedgerEntry[], System.ListLedgerError>`
- **Wire**: `GET /api/ledger`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `LedgerEntry[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `System.ListLedgerError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `System.ListLedgerRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `vaultId` | `query` | `string` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `LedgerEntry` | `ledgerEntrySchema` | `src/models/ledger-entry.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listMerchants

- **Signature**: `listMerchants(options?: RequestOptions): ApiPromise<Record<string, unknown>[], System.ListMerchantsError>`
- **Wire**: `GET /api/merchants`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Record<string, unknown>[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `System.ListMerchantsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### runBackgroundJobs

- **Signature**: `runBackgroundJobs(options?: RequestOptions): ApiPromise<Record<string, unknown>, System.RunBackgroundJobsError>`
- **Wire**: `POST /api/jobs/tick`
- **Auth**: `internalKey`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `System.RunBackgroundJobsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

