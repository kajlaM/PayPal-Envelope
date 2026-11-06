<!-- Generated file — do not edit; regenerated with the SDK. -->

# Products — operations

Accessor: `client.products` · Source: `src/resources/products.ts` · 1 operation · Request and error types: namespace `Products`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### lookupProduct

- **Signature**: `lookupProduct(request: Products.LookupProductRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Products.LookupProductError>`
- **Wire**: `POST /api/products/lookup`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Products.LookupProductError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [422] `Error` · `"error5"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Products.LookupProductRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `ApiProductsLookupRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiProductsLookupRequest` | `apiProductsLookupRequestSchema` | `src/models/api-products-lookup-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

