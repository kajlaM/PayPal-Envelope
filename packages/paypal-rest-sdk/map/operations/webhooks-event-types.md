<!-- Generated file — do not edit; regenerated with the SDK. -->

# WebhooksEventTypes — operations

Accessor: `client.webhooksEventTypes` · Source: `src/resources/webhooks-event-types.ts` · 1 operation · Request types: namespace `WebhooksEventTypes`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### webhooksEventTypesList

- **Signature**: `webhooksEventTypesList(options?: RequestOptions): ApiPromise<EventTypeList, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks-event-types`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `EventTypeList`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

| Type | Schema value | Source |
| --- | --- | --- |
| `EventTypeList` | `eventTypeListSchema` | `src/models/event-type-list.ts` |

