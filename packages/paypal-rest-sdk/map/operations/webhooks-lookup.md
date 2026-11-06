<!-- Generated file — do not edit; regenerated with the SDK. -->

# WebhooksLookup — operations

Accessor: `client.webhooksLookup` · Source: `src/resources/webhooks-lookup.ts` · 4 operations · Request types: namespace `WebhooksLookup`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### webhooksLookupDelete

- **Signature**: `webhooksLookupDelete(request: WebhooksLookup.WebhooksLookupDeleteRequest, options?: RequestOptions): ApiPromise<undefined, ApiError>`
- **Wire**: `DELETE /v1/notifications/webhooks-lookup/{webhook_lookup_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `WebhooksLookup.WebhooksLookupDeleteRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookLookupId` | `path` | `webhook_lookup_id` | `string` | yes |

### webhooksLookupGet

- **Signature**: `webhooksLookupGet(request: WebhooksLookup.WebhooksLookupGetRequest, options?: RequestOptions): ApiPromise<WebhookLookup, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks-lookup/{webhook_lookup_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `WebhookLookup`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `WebhooksLookup.WebhooksLookupGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookLookupId` | `path` | `webhook_lookup_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `WebhookLookup` | `webhookLookupSchema` | `src/models/webhook-lookup.ts` |

### webhooksLookupList

- **Signature**: `webhooksLookupList(options?: RequestOptions): ApiPromise<WebhookLookupList, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks-lookup`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `WebhookLookupList`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

| Type | Schema value | Source |
| --- | --- | --- |
| `WebhookLookupList` | `webhookLookupListSchema` | `src/models/webhook-lookup-list.ts` |

### webhooksLookupPost

- **Signature**: `webhooksLookupPost(options?: RequestOptions): ApiPromise<WebhookLookup, ApiError>`
- **Wire**: `POST /v1/notifications/webhooks-lookup`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `WebhookLookup`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

| Type | Schema value | Source |
| --- | --- | --- |
| `WebhookLookup` | `webhookLookupSchema` | `src/models/webhook-lookup.ts` |

