<!-- Generated file — do not edit; regenerated with the SDK. -->

# TemplatesApi — operations

Accessor: `client.templatesApi` · Source: `src/resources/templates-api.ts` · 5 operations · Request and error types: namespace `TemplatesApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### templatesCreate

- **Signature**: `templatesCreate(request: TemplatesApi.TemplatesCreateRequest, options?: RequestOptions): ApiPromise<Template, TemplatesApi.TemplatesCreateError>`
- **Wire**: `POST /v2/invoicing/templates`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Template`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `TemplatesApi.TemplatesCreateError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingTemplates400Error21"` [400] `V2InvoicingTemplates400Error21` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"v2InvoicingTemplates422Error1"` [422] `V2InvoicingTemplates422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `TemplatesApi.TemplatesCreateRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `Template` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Template` | `templateSchema` | `src/models/template.ts` |
| `V2InvoicingTemplates400Error21` | `v2InvoicingTemplates400Error21Schema` | `src/models/v2-invoicing-templates400-error21.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `V2InvoicingTemplates422Error1` | `v2InvoicingTemplates422Error1Schema` | `src/models/v2-invoicing-templates422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### templatesDelete

- **Signature**: `templatesDelete(request: TemplatesApi.TemplatesDeleteRequest, options?: RequestOptions): ApiPromise<undefined, TemplatesApi.TemplatesDeleteError>`
- **Wire**: `DELETE /v2/invoicing/templates/{template_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `TemplatesApi.TemplatesDeleteError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingTemplates403Error31"` [403] `V2InvoicingTemplates403Error31` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `TemplatesApi.TemplatesDeleteRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `templateId` | `path` | `template_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `V2InvoicingTemplates403Error31` | `v2InvoicingTemplates403Error31Schema` | `src/models/v2-invoicing-templates403-error31.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### templatesGet

- **Signature**: `templatesGet(request: TemplatesApi.TemplatesGetRequest, options?: RequestOptions): ApiPromise<Template, TemplatesApi.TemplatesGetError>`
- **Wire**: `GET /v2/invoicing/templates/{template_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Template`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `TemplatesApi.TemplatesGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingTemplates403Error1"` [403] `V2InvoicingTemplates403Error1` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `TemplatesApi.TemplatesGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `templateId` | `path` | `template_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Template` | `templateSchema` | `src/models/template.ts` |
| `V2InvoicingTemplates403Error1` | `v2InvoicingTemplates403Error1Schema` | `src/models/v2-invoicing-templates403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### templatesList

- **Signature**: `templatesList(request?: TemplatesApi.TemplatesListRequest, options?: RequestOptions): ApiPromise<Templates, TemplatesApi.TemplatesListError>`
- **Wire**: `GET /v2/invoicing/templates`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Templates`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `TemplatesApi.TemplatesListError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingTemplates400Error1"` [400] `V2InvoicingTemplates400Error1` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `TemplatesApi.TemplatesListRequest` (3):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `fields` | `query` | — | `string` | no | `"all"` |
| `page` | `query` | — | `number` | no | `1` |
| `pageSize` | `query` | `page_size` | `number` | no | `20` |

| Type | Schema value | Source |
| --- | --- | --- |
| `Templates` | `templatesSchema` | `src/models/templates.ts` |
| `V2InvoicingTemplates400Error1` | `v2InvoicingTemplates400Error1Schema` | `src/models/v2-invoicing-templates400-error1.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### templatesUpdate

- **Signature**: `templatesUpdate(request: TemplatesApi.TemplatesUpdateRequest, options?: RequestOptions): ApiPromise<Template, TemplatesApi.TemplatesUpdateError>`
- **Wire**: `PUT /v2/invoicing/templates/{template_id}`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Template`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `TemplatesApi.TemplatesUpdateError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingTemplates400Error21"` [400] `V2InvoicingTemplates400Error21` · `"v2InvoicingTemplates403Error1"` [403] `V2InvoicingTemplates403Error1` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `TemplatesApi.TemplatesUpdateRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `templateId` | `path` | `template_id` | `string` | yes |
| `body` | `body` | — | `Template` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Template` | `templateSchema` | `src/models/template.ts` |
| `V2InvoicingTemplates400Error21` | `v2InvoicingTemplates400Error21Schema` | `src/models/v2-invoicing-templates400-error21.ts` |
| `V2InvoicingTemplates403Error1` | `v2InvoicingTemplates403Error1Schema` | `src/models/v2-invoicing-templates403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

