<!-- Generated file — do not edit; regenerated with the SDK. -->

# SimulateEventApi — operations

Accessor: `client.simulateEventApi` · Source: `src/resources/simulate-event-api.ts` · 1 operation · Request types: namespace `SimulateEventApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### simulateEventPost

- **Signature**: `simulateEventPost(request?: SimulateEventApi.SimulateEventPostRequest, options?: RequestOptions): ApiPromise<Event, ApiError>`
- **Wire**: `POST /v1/notifications/simulate-event`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Event`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `SimulateEventApi.SimulateEventPostRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `SimulateEvent` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `SimulateEvent` | `simulateEventSchema` | `src/models/simulate-event.ts` |
| `Event` | `eventSchema` | `src/models/event.ts` |

