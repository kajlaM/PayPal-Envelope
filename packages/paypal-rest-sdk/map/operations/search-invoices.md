<!-- Generated file — do not edit; regenerated with the SDK. -->

# SearchInvoices — operations

Accessor: `client.searchInvoices` · Source: `src/resources/search-invoices.ts` · 1 operation · Request and error types: namespace `SearchInvoices`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### invoicesSearchInvoices

- **Signature**: `invoicesSearchInvoices(request?: SearchInvoices.InvoicesSearchInvoicesRequest, options?: RequestOptions): ApiPromise<Invoices, SearchInvoices.InvoicesSearchInvoicesError>`
- **Wire**: `POST /v2/invoicing/search-invoices`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Invoices`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `SearchInvoices.InvoicesSearchInvoicesError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingSearchInvoices400Error1"` [400] `V2InvoicingSearchInvoices400Error1` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `SearchInvoices.InvoicesSearchInvoicesRequest` (4):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `page` | `query` | — | `number` | no | `1` |
| `pageSize` | `query` | `page_size` | `number` | no | `20` |
| `totalRequired` | `query` | `total_required` | `boolean` | no | `false` |
| `body` | `body` | — | `SearchData` | no | — |

| Type | Schema value | Source |
| --- | --- | --- |
| `SearchData` | `searchDataSchema` | `src/models/search-data.ts` |
| `Invoices` | `invoicesSchema` | `src/models/invoices.ts` |
| `V2InvoicingSearchInvoices400Error1` | `v2InvoicingSearchInvoices400Error1Schema` | `src/models/v2-invoicing-search-invoices400-error1.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

