<!-- Generated file — do not edit; regenerated with the SDK. -->

# Payouts — operations

Accessor: `client.payouts` · Source: `src/resources/payouts.ts` · 2 operations · Request and error types: namespace `Payouts`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### payoutsGet

- **Signature**: `payoutsGet(request: Payouts.PayoutsGetRequest, options?: RequestOptions): ApiPromise<PayoutBatch, Payouts.PayoutsGetError>`
- **Wire**: `GET /v1/payments/payouts/{id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `PayoutBatch`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `Payouts.PayoutsGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [500] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Payouts.PayoutsGetRequest` (5):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `id` | `path` | — | `string` | yes | — |
| `fields` | `query` | — | `string` | no | — |
| `page` | `query` | — | `number` | no | `1` |
| `pageSize` | `query` | `page_size` | `number` | no | — |
| `totalRequired` | `query` | `total_required` | `boolean` | no | `false` |

| Type | Schema value | Source |
| --- | --- | --- |
| `PayoutBatch` | `payoutBatchSchema` | `src/models/payout-batch.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### payoutsPost

- **Signature**: `payoutsPost(request?: Payouts.PayoutsPostRequest, options?: RequestOptions): ApiPromise<CreatePayoutResponse, Payouts.PayoutsPostError>`
- **Wire**: `POST /v1/payments/payouts`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `CreatePayoutResponse`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `Payouts.PayoutsPostError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [403] `Error` · `"error3"` [500] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Payouts.PayoutsPostRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `payPalRequestId` | `header` | `PayPal-Request-Id` | `string` | no |
| `body` | `body` | — | `CreatePayoutRequest` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `CreatePayoutRequest` | `createPayoutRequestSchema` | `src/models/create-payout-request.ts` |
| `CreatePayoutResponse` | `createPayoutResponseSchema` | `src/models/create-payout-response.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

