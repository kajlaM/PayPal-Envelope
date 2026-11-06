<!-- Generated file — do not edit; regenerated with the SDK. -->

# Purchases — operations

Accessor: `client.purchases` · Source: `src/resources/purchases.ts` · 6 operations · Request and error types: namespace `Purchases`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### approvePurchase

- **Signature**: `approvePurchase(request: Purchases.ApprovePurchaseRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Purchases.ApprovePurchaseError>`
- **Wire**: `POST /api/vaults/{id}/decisions/{decisionId}/approve`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.ApprovePurchaseError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.ApprovePurchaseRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `decisionId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### chooseOption

- **Signature**: `chooseOption(request: Purchases.ChooseOptionRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Purchases.ChooseOptionError>`
- **Wire**: `POST /api/vaults/{id}/proposals/{proposalId}/choose`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.ChooseOptionError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.ChooseOptionRequest` (3):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `proposalId` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsProposalsChooseRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsProposalsChooseRequest` | `apiVaultsProposalsChooseRequestSchema` | `src/models/api-vaults-proposals-choose-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### proposeOptions

- **Signature**: `proposeOptions(request: Purchases.ProposeOptionsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Purchases.ProposeOptionsError>`
- **Wire**: `POST /api/vaults/{id}/proposals`
- **Auth**: `internalKey`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.ProposeOptionsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.ProposeOptionsRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsProposalsRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsProposalsRequest` | `apiVaultsProposalsRequestSchema` | `src/models/api-vaults-proposals-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### rejectOptions

- **Signature**: `rejectOptions(request: Purchases.RejectOptionsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Purchases.RejectOptionsError>`
- **Wire**: `POST /api/vaults/{id}/proposals/{proposalId}/reject`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.RejectOptionsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.RejectOptionsRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `proposalId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### rejectPurchase

- **Signature**: `rejectPurchase(request: Purchases.RejectPurchaseRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Purchases.RejectPurchaseError>`
- **Wire**: `POST /api/vaults/{id}/decisions/{decisionId}/reject`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.RejectPurchaseError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.RejectPurchaseRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `decisionId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### requestPurchase

- **Signature**: `requestPurchase(request: Purchases.RequestPurchaseRequest, options?: RequestOptions): ApiPromise<SpendResult, Purchases.RequestPurchaseError>`
- **Wire**: `POST /api/vaults/{id}/spend`
- **Auth**: `internalKey`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `SpendResult`
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Purchases.RequestPurchaseError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"spendResult"` [403] `SpendResult` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Purchases.RequestPurchaseRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsSpendRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsSpendRequest` | `apiVaultsSpendRequestSchema` | `src/models/api-vaults-spend-request.ts` |
| `SpendResult` | `spendResultSchema` | `src/models/spend-result.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

