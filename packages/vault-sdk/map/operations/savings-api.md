<!-- Generated file — do not edit; regenerated with the SDK. -->

# SavingsApi — operations

Accessor: `client.savingsApi` · Source: `src/resources/savings-api.ts` · 4 operations · Request and error types: namespace `SavingsApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### chargeSavingsNow

- **Signature**: `chargeSavingsNow(request: SavingsApi.ChargeSavingsNowRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, SavingsApi.ChargeSavingsNowError>`
- **Wire**: `POST /api/vaults/{id}/savings/charge`
- **Auth**: `internalKey`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `SavingsApi.ChargeSavingsNowError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `SavingsApi.ChargeSavingsNowRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### moveSavingsPayment

- **Signature**: `moveSavingsPayment(request: SavingsApi.MoveSavingsPaymentRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, SavingsApi.MoveSavingsPaymentError>`
- **Wire**: `POST /api/vaults/{id}/savings/next`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `SavingsApi.MoveSavingsPaymentError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `SavingsApi.MoveSavingsPaymentRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsSavingsNextRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsSavingsNextRequest` | `apiVaultsSavingsNextRequestSchema` | `src/models/api-vaults-savings-next-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### pauseSavings

- **Signature**: `pauseSavings(request: SavingsApi.PauseSavingsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, SavingsApi.PauseSavingsError>`
- **Wire**: `POST /api/vaults/{id}/savings/pause`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `SavingsApi.PauseSavingsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `SavingsApi.PauseSavingsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### resumeSavings

- **Signature**: `resumeSavings(request: SavingsApi.ResumeSavingsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, SavingsApi.ResumeSavingsError>`
- **Wire**: `POST /api/vaults/{id}/savings/resume`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `SavingsApi.ResumeSavingsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `SavingsApi.ResumeSavingsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

