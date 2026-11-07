<!-- Generated file — do not edit; regenerated with the SDK. -->

# Vaults — operations

Accessor: `client.vaults` · Source: `src/resources/vaults.ts` · 9 operations · Request and error types: namespace `Vaults`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### changeExpiry

- **Signature**: `changeExpiry(request: Vaults.ChangeExpiryRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Vaults.ChangeExpiryError>`
- **Wire**: `POST /api/vaults/{id}/expiry`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.ChangeExpiryError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.ChangeExpiryRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsExpiryRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsExpiryRequest` | `apiVaultsExpiryRequestSchema` | `src/models/api-vaults-expiry-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### changePolicy

- **Signature**: `changePolicy(request: Vaults.ChangePolicyRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Vaults.ChangePolicyError>`
- **Wire**: `POST /api/vaults/{id}/policy`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.ChangePolicyError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.ChangePolicyRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsPolicyRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsPolicyRequest` | `apiVaultsPolicyRequestSchema` | `src/models/api-vaults-policy-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### compilePolicy

- **Signature**: `compilePolicy(request: Vaults.CompilePolicyRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Vaults.CompilePolicyError>`
- **Wire**: `POST /api/vaults/compile`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.CompilePolicyError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.CompilePolicyRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `ApiVaultsCompileRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsCompileRequest` | `apiVaultsCompileRequestSchema` | `src/models/api-vaults-compile-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### createVault

- **Signature**: `createVault(request: Vaults.CreateVaultRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Vaults.CreateVaultError>`
- **Wire**: `POST /api/vaults`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.CreateVaultError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.CreateVaultRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `ApiVaultsRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsRequest` | `apiVaultsRequestSchema` | `src/models/api-vaults-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### getVault

- **Signature**: `getVault(request: Vaults.GetVaultRequest, options?: RequestOptions): ApiPromise<VaultDetails, Vaults.GetVaultError>`
- **Wire**: `GET /api/vaults/{id}`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `VaultDetails`
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.GetVaultError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.GetVaultRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `VaultDetails` | `vaultDetailsSchema` | `src/models/vault-details.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### liquidateVault

- **Signature**: `liquidateVault(request: Vaults.LiquidateVaultRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Vaults.LiquidateVaultError>`
- **Wire**: `POST /api/vaults/{id}/liquidate`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.LiquidateVaultError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.LiquidateVaultRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listVaultDetails

- **Signature**: `listVaultDetails(request: Vaults.ListVaultDetailsRequest, options?: RequestOptions): ApiPromise<VaultDetails[], Vaults.ListVaultDetailsError>`
- **Wire**: `GET /api/vaults/details`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `VaultDetails[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.ListVaultDetailsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.ListVaultDetailsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `userId` | `query` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `VaultDetails` | `vaultDetailsSchema` | `src/models/vault-details.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listVaults

- **Signature**: `listVaults(options?: RequestOptions): ApiPromise<VaultSummary[], Vaults.ListVaultsError>`
- **Wire**: `GET /api/vaults`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `VaultSummary[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.ListVaultsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `VaultSummary` | `vaultSummarySchema` | `src/models/vault-summary.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### syncVault

- **Signature**: `syncVault(request: Vaults.SyncVaultRequest, options?: RequestOptions): ApiPromise<ApiVaultsSyncResponse[], Vaults.SyncVaultError>`
- **Wire**: `POST /api/vaults/{id}/sync`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `ApiVaultsSyncResponse[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Vaults.SyncVaultError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Vaults.SyncVaultRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsSyncResponse` | `apiVaultsSyncResponseSchema` | `src/models/api-vaults-sync-response.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

