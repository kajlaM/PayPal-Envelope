<!-- Generated file — do not edit; regenerated with the SDK. -->

# Funding — operations

Accessor: `client.funding` · Source: `src/resources/funding.ts` · 10 operations · Request and error types: namespace `Funding`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### cancelFundRequest

- **Signature**: `cancelFundRequest(request: Funding.CancelFundRequestRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.CancelFundRequestError>`
- **Wire**: `POST /api/vaults/{id}/fund/requests/{requestId}/cancel`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.CancelFundRequestError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.CancelFundRequestRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `requestId` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### captureFunding

- **Signature**: `captureFunding(request: Funding.CaptureFundingRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.CaptureFundingError>`
- **Wire**: `POST /api/vaults/{id}/fund/capture`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.CaptureFundingError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.CaptureFundingRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsFundCaptureRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsFundCaptureRequest` | `apiVaultsFundCaptureRequestSchema` | `src/models/api-vaults-fund-capture-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### confirmSubscription

- **Signature**: `confirmSubscription(request: Funding.ConfirmSubscriptionRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.ConfirmSubscriptionError>`
- **Wire**: `POST /api/vaults/{id}/subscribe/confirm`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.ConfirmSubscriptionError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.ConfirmSubscriptionRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsSubscribeConfirmRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsSubscribeConfirmRequest` | `apiVaultsSubscribeConfirmRequestSchema` | `src/models/api-vaults-subscribe-confirm-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### createFundRequest

- **Signature**: `createFundRequest(request: Funding.CreateFundRequestRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.CreateFundRequestError>`
- **Wire**: `POST /api/vaults/{id}/fund/requests`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.CreateFundRequestError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.CreateFundRequestRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsFundRequestsRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsFundRequestsRequest` | `apiVaultsFundRequestsRequestSchema` | `src/models/api-vaults-fund-requests-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### createFundingOrder

- **Signature**: `createFundingOrder(request: Funding.CreateFundingOrderRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.CreateFundingOrderError>`
- **Wire**: `POST /api/vaults/{id}/fund/order`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.CreateFundingOrderError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.CreateFundingOrderRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### createSubscription

- **Signature**: `createSubscription(request: Funding.CreateSubscriptionRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.CreateSubscriptionError>`
- **Wire**: `POST /api/vaults/{id}/subscribe`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.CreateSubscriptionError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.CreateSubscriptionRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### listFundRequests

- **Signature**: `listFundRequests(request: Funding.ListFundRequestsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>[], Funding.ListFundRequestsError>`
- **Wire**: `GET /api/fund-requests`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Record<string, unknown>[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.ListFundRequestsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.ListFundRequestsRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `payerEmail` | `query` | `string` | yes |
| `status` | `query` | `Status3` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Status3` | `status3Schema` | `src/models/status3.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### recordFunding

- **Signature**: `recordFunding(request: Funding.RecordFundingRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.RecordFundingError>`
- **Wire**: `POST /api/vaults/{id}/fund/recorded`
- **Auth**: `internalKey`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.RecordFundingError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.RecordFundingRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsFundRecordedRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsFundRecordedRequest` | `apiVaultsFundRecordedRequestSchema` | `src/models/api-vaults-fund-recorded-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### syncFundRequest

- **Signature**: `syncFundRequest(request: Funding.SyncFundRequestRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.SyncFundRequestError>`
- **Wire**: `POST /api/fund-requests/{id}/sync`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.SyncFundRequestError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.SyncFundRequestRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### syncFundRequests

- **Signature**: `syncFundRequests(request: Funding.SyncFundRequestsRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Funding.SyncFundRequestsError>`
- **Wire**: `POST /api/vaults/{id}/fund/requests/sync`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Funding.SyncFundRequestsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Funding.SyncFundRequestsRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

