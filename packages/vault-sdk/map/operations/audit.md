<!-- Generated file — do not edit; regenerated with the SDK. -->

# Audit — operations

Accessor: `client.audit` · Source: `src/resources/audit.ts` · 3 operations · Request and error types: namespace `Audit`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### askAudit

- **Signature**: `askAudit(request: Audit.AskAuditRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Audit.AskAuditError>`
- **Wire**: `POST /api/audit/ask`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Audit.AskAuditError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Audit.AskAuditRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `ApiAuditAskRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiAuditAskRequest` | `apiAuditAskRequestSchema` | `src/models/api-audit-ask-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### reindexAudit

- **Signature**: `reindexAudit(options?: RequestOptions): ApiPromise<Record<string, unknown>, Audit.ReindexAuditError>`
- **Wire**: `POST /api/audit/reindex`
- **Auth**: `internalKey`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Audit.ReindexAuditError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

### searchAudit

- **Signature**: `searchAudit(request: Audit.SearchAuditRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>[], Audit.SearchAuditError>`
- **Wire**: `GET /api/audit/search`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Record<string, unknown>[]` — a bare `application/json` array; the success type *is* the array, not a wrapper model
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Audit.SearchAuditError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Audit.SearchAuditRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `q` | `query` | `string` | yes |
| `vaultId` | `query` | `string` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

