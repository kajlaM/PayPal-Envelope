<!-- Generated file — do not edit; regenerated with the SDK. -->

# PayoutsItem — operations

Accessor: `client.payoutsItem` · Source: `src/resources/payouts-item.ts` · 2 operations · Request and error types: namespace `PayoutsItem`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### payoutsItemCancel

- **Signature**: `payoutsItemCancel(request: PayoutsItem.PayoutsItemCancelRequest, options?: RequestOptions): ApiPromise<PayoutItem2, PayoutsItem.PayoutsItemCancelError>`
- **Wire**: `POST /v1/payments/payouts-item/{payout_item_id}/cancel`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `PayoutItem2`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `PayoutsItem.PayoutsItemCancelError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [500] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `PayoutsItem.PayoutsItemCancelRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `payoutItemId` | `path` | `payout_item_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PayoutItem2` | `payoutItem2Schema` | `src/models/payout-item2.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### payoutsItemGet

- **Signature**: `payoutsItemGet(request: PayoutsItem.PayoutsItemGetRequest, options?: RequestOptions): ApiPromise<PayoutItem2, PayoutsItem.PayoutsItemGetError>`
- **Wire**: `GET /v1/payments/payouts-item/{payout_item_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `PayoutItem2`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `PayoutsItem.PayoutsItemGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [404] `Error` · `"error2"` [500] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `PayoutsItem.PayoutsItemGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `payoutItemId` | `path` | `payout_item_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PayoutItem2` | `payoutItem2Schema` | `src/models/payout-item2.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

