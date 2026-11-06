<!-- Generated file — do not edit; regenerated with the SDK. -->

# Webhooks — operations

Accessor: `client.webhooks` · Source: `src/resources/webhooks.ts` · 6 operations · Request types: namespace `Webhooks`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### eventTypesList

- **Signature**: `eventTypesList(request: Webhooks.EventTypesListRequest, options?: RequestOptions): ApiPromise<EventTypeList, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks/{webhook_id}/event-types`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `EventTypeList`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.EventTypesListRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookId` | `path` | `webhook_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `EventTypeList` | `eventTypeListSchema` | `src/models/event-type-list.ts` |

### webhooksDelete

- **Signature**: `webhooksDelete(request: Webhooks.WebhooksDeleteRequest, options?: RequestOptions): ApiPromise<undefined, ApiError>`
- **Wire**: `DELETE /v1/notifications/webhooks/{webhook_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.WebhooksDeleteRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookId` | `path` | `webhook_id` | `string` | yes |

### webhooksGet

- **Signature**: `webhooksGet(request: Webhooks.WebhooksGetRequest, options?: RequestOptions): ApiPromise<Webhook, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks/{webhook_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Webhook`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.WebhooksGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookId` | `path` | `webhook_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Webhook` | `webhookSchema` | `src/models/webhook.ts` |

### webhooksList

- **Signature**: `webhooksList(request?: Webhooks.WebhooksListRequest, options?: RequestOptions): ApiPromise<WebhookList, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `WebhookList`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.WebhooksListRequest` (1):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `anchorType` | `query` | `anchor_type` | `AnchorType` | no | `AnchorType.Application` |

| Type | Schema value | Source |
| --- | --- | --- |
| `AnchorType` | `anchorTypeSchema` | `src/models/anchor-type.ts` |
| `WebhookList` | `webhookListSchema` | `src/models/webhook-list.ts` |

### webhooksPost

- **Signature**: `webhooksPost(request?: Webhooks.WebhooksPostRequest, options?: RequestOptions): ApiPromise<Webhook, ApiError>`
- **Wire**: `POST /v1/notifications/webhooks`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Webhook`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.WebhooksPostRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `Webhook` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Webhook` | `webhookSchema` | `src/models/webhook.ts` |

### webhooksUpdate

- **Signature**: `webhooksUpdate(request: Webhooks.WebhooksUpdateRequest, options?: RequestOptions): ApiPromise<Webhook, ApiError>`
- **Wire**: `PATCH /v1/notifications/webhooks/{webhook_id}`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field, a bare top-level JSON array. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Webhook`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `Webhooks.WebhooksUpdateRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `webhookId` | `path` | `webhook_id` | `string` | yes |
| `body` | `body` | — | `Patch[]` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Patch` | `patchSchema` | `src/models/patch.ts` |
| `Webhook` | `webhookSchema` | `src/models/webhook.ts` |

