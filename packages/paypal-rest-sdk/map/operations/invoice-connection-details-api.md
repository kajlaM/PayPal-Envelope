<!-- Generated file — do not edit; regenerated with the SDK. -->

# InvoiceConnectionDetailsApi — operations

Accessor: `client.invoiceConnectionDetailsApi` · Source: `src/resources/invoice-connection-details-api.ts` · 1 operation · Request and error types: namespace `InvoiceConnectionDetailsApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### invoiceConnectionDetailsGet

- **Signature**: `invoiceConnectionDetailsGet(request: InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetRequest, options?: RequestOptions): ApiPromise<InvoiceConnectionDetails, InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError>`
- **Wire**: `GET /v2/invoicing/accounting-sync/invoices/{id}/connections`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `InvoiceConnectionDetails`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `InvoiceConnectionDetails` | `invoiceConnectionDetailsSchema` | `src/models/invoice-connection-details.ts` |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

