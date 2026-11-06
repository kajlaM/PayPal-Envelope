<!-- Generated file — do not edit; regenerated with the SDK. -->

# ConnectionsApi — operations

Accessor: `client.connectionsApi` · Source: `src/resources/connections-api.ts` · 1 operation · Request and error types: namespace `ConnectionsApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### connectionsGet

- **Signature**: `connectionsGet(options?: RequestOptions): ApiPromise<Connections1, ConnectionsApi.ConnectionsGetError>`
- **Wire**: `GET /v2/invoicing/accounting-sync/merchant/connections`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Connections1`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `ConnectionsApi.ConnectionsGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `Connections1` | `connections1Schema` | `src/models/connections1.ts` |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

