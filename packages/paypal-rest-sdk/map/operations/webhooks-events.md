<!-- Generated file — do not edit; regenerated with the SDK. -->

# WebhooksEvents — operations

Accessor: `client.webhooksEvents` · Source: `src/resources/webhooks-events.ts` · 3 operations · Request types: namespace `WebhooksEvents`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### webhooksEventsGet

- **Signature**: `webhooksEventsGet(request: WebhooksEvents.WebhooksEventsGetRequest, options?: RequestOptions): ApiPromise<Event, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks-events/{event_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Event`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `WebhooksEvents.WebhooksEventsGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `eventId` | `path` | `event_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Event` | `eventSchema` | `src/models/event.ts` |

### webhooksEventsList

- **Signature**: `webhooksEventsList(request?: WebhooksEvents.WebhooksEventsListRequest, options?: RequestOptions): ApiPromise<EventList, ApiError>`
- **Wire**: `GET /v1/notifications/webhooks-events`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `EventList`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `WebhooksEvents.WebhooksEventsListRequest` (5):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `pageSize` | `query` | `page_size` | `number` | no | `10` |
| `startTime` | `query` | `start_time` | `string` | no | — |
| `endTime` | `query` | `end_time` | `string` | no | — |
| `transactionId` | `query` | `transaction_id` | `string` | no | — |
| `eventType` | `query` | `event_type` | `string` | no | — |

| Type | Schema value | Source |
| --- | --- | --- |
| `EventList` | `eventListSchema` | `src/models/event-list.ts` |

### webhooksEventsResend

- **Signature**: `webhooksEventsResend(request: WebhooksEvents.WebhooksEventsResendRequest, options?: RequestOptions): ApiPromise<Event, ApiError>`
- **Wire**: `POST /v1/notifications/webhooks-events/{event_id}/resend`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Event`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `WebhooksEvents.WebhooksEventsResendRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `eventId` | `path` | `event_id` | `string` | yes |
| `body` | `body` | — | `EventResend` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `EventResend` | `eventResendSchema` | `src/models/event-resend.ts` |
| `Event` | `eventSchema` | `src/models/event.ts` |

