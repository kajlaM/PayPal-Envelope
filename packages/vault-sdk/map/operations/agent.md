<!-- Generated file — do not edit; regenerated with the SDK. -->

# Agent — operations

Accessor: `client.agent` · Source: `src/resources/agent.ts` · 3 operations · Request and error types: namespace `Agent`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### runAgent

- **Signature**: `runAgent(request: Agent.RunAgentRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Agent.RunAgentError>`
- **Wire**: `POST /api/vaults/{id}/agent`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Agent.RunAgentError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Agent.RunAgentRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsAgentRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsAgentRequest` | `apiVaultsAgentRequestSchema` | `src/models/api-vaults-agent-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### scheduleAgent

- **Signature**: `scheduleAgent(request: Agent.ScheduleAgentRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Agent.ScheduleAgentError>`
- **Wire**: `POST /api/vaults/{id}/agent/next`
- **Auth**: none — public; no credential is sent
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Agent.ScheduleAgentError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Agent.ScheduleAgentRequest` (2):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |
| `body` | `body` | `ApiVaultsAgentNextRequest` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `ApiVaultsAgentNextRequest` | `apiVaultsAgentNextRequestSchema` | `src/models/api-vaults-agent-next-request.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

### stopAgent

- **Signature**: `stopAgent(request: Agent.StopAgentRequest, options?: RequestOptions): ApiPromise<Record<string, unknown>, Agent.StopAgentError>`
- **Wire**: `POST /api/vaults/{id}/agent/stop`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Record<string, unknown>` — a bare `application/json` map; the success type *is* the map
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `Agent.StopAgentError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `Agent.StopAgentRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Error` | `errorSchema` | `src/models/error.ts` |

