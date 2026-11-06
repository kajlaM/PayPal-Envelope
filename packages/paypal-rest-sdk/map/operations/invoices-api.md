<!-- Generated file — do not edit; regenerated with the SDK. -->

# InvoicesApi — operations

Accessor: `client.invoicesApi` · Source: `src/resources/invoices-api.ts` · 14 operations · Request and error types: namespace `InvoicesApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### invoicesCancel

- **Signature**: `invoicesCancel(request: InvoicesApi.InvoicesCancelRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesCancelError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/cancel`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesCancelError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoicesCancel400Error1"` [400] `V2InvoicingInvoicesCancel400Error1` · `"v2InvoicingInvoicesCancel403Error1"` [403] `V2InvoicingInvoicesCancel403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoicesCancel422Error1"` [422] `V2InvoicingInvoicesCancel422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesCancelRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `Notification` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Notification` | `notificationSchema` | `src/models/notification.ts` |
| `V2InvoicingInvoicesCancel400Error1` | `v2InvoicingInvoicesCancel400Error1Schema` | `src/models/v2-invoicing-invoices-cancel400-error1.ts` |
| `V2InvoicingInvoicesCancel403Error1` | `v2InvoicingInvoicesCancel403Error1Schema` | `src/models/v2-invoicing-invoices-cancel403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoicesCancel422Error1` | `v2InvoicingInvoicesCancel422Error1Schema` | `src/models/v2-invoicing-invoices-cancel422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesCreate

- **Signature**: `invoicesCreate(request: InvoicesApi.InvoicesCreateRequest, options?: RequestOptions): ApiPromise<Invoice, InvoicesApi.InvoicesCreateError>`
- **Wire**: `POST /v2/invoicing/invoices`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Invoice`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesCreateError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoices400Error1"` [400] `V2InvoicingInvoices400Error1` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"v2InvoicingInvoices422Error1"` [422] `V2InvoicingInvoices422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesCreateRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `Invoice` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Invoice` | `invoiceSchema` | `src/models/invoice.ts` |
| `V2InvoicingInvoices400Error1` | `v2InvoicingInvoices400Error1Schema` | `src/models/v2-invoicing-invoices400-error1.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `V2InvoicingInvoices422Error1` | `v2InvoicingInvoices422Error1Schema` | `src/models/v2-invoicing-invoices422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesDelete

- **Signature**: `invoicesDelete(request: InvoicesApi.InvoicesDeleteRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesDeleteError>`
- **Wire**: `DELETE /v2/invoicing/invoices/{invoice_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesDeleteError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"v2InvoicingInvoices403Error1"` [403] `V2InvoicingInvoices403Error1` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesDeleteRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `V2InvoicingInvoices403Error1` | `v2InvoicingInvoices403Error1Schema` | `src/models/v2-invoicing-invoices403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesGenerateQrCode

- **Signature**: `invoicesGenerateQrCode(request: InvoicesApi.InvoicesGenerateQrCodeRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesGenerateQrCodeError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/generate-qr-code`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesGenerateQrCodeError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error400"` [400] no body · `"error403"` [403] no body · `"error404"` [404] no body · `"error500"` [500] no body · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesGenerateQrCodeRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `QrConfiguration` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `QrConfiguration` | `qrConfigurationSchema` | `src/models/qr-configuration.ts` |

### invoicesGet

- **Signature**: `invoicesGet(request: InvoicesApi.InvoicesGetRequest, options?: RequestOptions): ApiPromise<Invoice, InvoicesApi.InvoicesGetError>`
- **Wire**: `GET /v2/invoicing/invoices/{invoice_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Invoice`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesGetError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"v2InvoicingInvoices403Error1"` [403] `V2InvoicingInvoices403Error1` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesGetRequest` (1):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `Invoice` | `invoiceSchema` | `src/models/invoice.ts` |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `V2InvoicingInvoices403Error1` | `v2InvoicingInvoices403Error1Schema` | `src/models/v2-invoicing-invoices403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesList

- **Signature**: `invoicesList(request?: InvoicesApi.InvoicesListRequest, options?: RequestOptions): ApiPromise<Invoices, InvoicesApi.InvoicesListError>`
- **Wire**: `GET /v2/invoicing/invoices`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **Returns**: `Invoices`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesListError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoices400Error21"` [400] `V2InvoicingInvoices400Error21` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesListRequest` (4):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `page` | `query` | — | `number` | no | `1` |
| `pageSize` | `query` | `page_size` | `number` | no | `20` |
| `totalRequired` | `query` | `total_required` | `boolean` | no | `false` |
| `fields` | `query` | — | `string` | no | `"all"` |

| Type | Schema value | Source |
| --- | --- | --- |
| `Invoices` | `invoicesSchema` | `src/models/invoices.ts` |
| `V2InvoicingInvoices400Error21` | `v2InvoicingInvoices400Error21Schema` | `src/models/v2-invoicing-invoices400-error21.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesPayments

- **Signature**: `invoicesPayments(request: InvoicesApi.InvoicesPaymentsRequest, options?: RequestOptions): ApiPromise<PaymentReference, InvoicesApi.InvoicesPaymentsError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/payments`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `PaymentReference`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesPaymentsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoicesPayments400Error1"` [400] `V2InvoicingInvoicesPayments400Error1` · `"v2InvoicingInvoicesPayments403Error1"` [403] `V2InvoicingInvoicesPayments403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoicesPayments422Error1"` [422] `V2InvoicingInvoicesPayments422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesPaymentsRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `PaymentDetail` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `PaymentDetail` | `paymentDetailSchema` | `src/models/payment-detail.ts` |
| `PaymentReference` | `paymentReferenceSchema` | `src/models/payment-reference.ts` |
| `V2InvoicingInvoicesPayments400Error1` | `v2InvoicingInvoicesPayments400Error1Schema` | `src/models/v2-invoicing-invoices-payments400-error1.ts` |
| `V2InvoicingInvoicesPayments403Error1` | `v2InvoicingInvoicesPayments403Error1Schema` | `src/models/v2-invoicing-invoices-payments403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoicesPayments422Error1` | `v2InvoicingInvoicesPayments422Error1Schema` | `src/models/v2-invoicing-invoices-payments422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesPaymentsDelete

- **Signature**: `invoicesPaymentsDelete(request: InvoicesApi.InvoicesPaymentsDeleteRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesPaymentsDeleteError>`
- **Wire**: `DELETE /v2/invoicing/invoices/{invoice_id}/payments/{transaction_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesPaymentsDeleteError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"v2InvoicingInvoicesPayments403Error1"` [403] `V2InvoicingInvoicesPayments403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoicesPayments422Error21"` [422] `V2InvoicingInvoicesPayments422Error21` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesPaymentsDeleteRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `transactionId` | `path` | `transaction_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `V2InvoicingInvoicesPayments403Error1` | `v2InvoicingInvoicesPayments403Error1Schema` | `src/models/v2-invoicing-invoices-payments403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoicesPayments422Error21` | `v2InvoicingInvoicesPayments422Error21Schema` | `src/models/v2-invoicing-invoices-payments422-error21.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesRefunds

- **Signature**: `invoicesRefunds(request: InvoicesApi.InvoicesRefundsRequest, options?: RequestOptions): ApiPromise<RefundPaymentReference, InvoicesApi.InvoicesRefundsError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/refunds`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `RefundPaymentReference`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesRefundsError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoicesRefunds400Error1"` [400] `V2InvoicingInvoicesRefunds400Error1` · `"v2InvoicingInvoicesRefunds403Error1"` [403] `V2InvoicingInvoicesRefunds403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoicesRefunds422Error1"` [422] `V2InvoicingInvoicesRefunds422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesRefundsRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `RefundDetail` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `RefundDetail` | `refundDetailSchema` | `src/models/refund-detail.ts` |
| `RefundPaymentReference` | `refundPaymentReferenceSchema` | `src/models/refund-payment-reference.ts` |
| `V2InvoicingInvoicesRefunds400Error1` | `v2InvoicingInvoicesRefunds400Error1Schema` | `src/models/v2-invoicing-invoices-refunds400-error1.ts` |
| `V2InvoicingInvoicesRefunds403Error1` | `v2InvoicingInvoicesRefunds403Error1Schema` | `src/models/v2-invoicing-invoices-refunds403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoicesRefunds422Error1` | `v2InvoicingInvoicesRefunds422Error1Schema` | `src/models/v2-invoicing-invoices-refunds422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesRefundsDelete

- **Signature**: `invoicesRefundsDelete(request: InvoicesApi.InvoicesRefundsDeleteRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesRefundsDeleteError>`
- **Wire**: `DELETE /v2/invoicing/invoices/{invoice_id}/refunds/{transaction_id}`
- **Auth**: `oauth2`
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesRefundsDeleteError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"v2InvoicingInvoicesRefunds403Error1"` [403] `V2InvoicingInvoicesRefunds403Error1` · `"notFoundError"` [404] `NotFoundError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesRefundsDeleteRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `transactionId` | `path` | `transaction_id` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `V2InvoicingInvoicesRefunds403Error1` | `v2InvoicingInvoicesRefunds403Error1Schema` | `src/models/v2-invoicing-invoices-refunds403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesRemind

- **Signature**: `invoicesRemind(request: InvoicesApi.InvoicesRemindRequest, options?: RequestOptions): ApiPromise<undefined, InvoicesApi.InvoicesRemindError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/remind`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `undefined` — the operation resolves to nothing
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesRemindError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoicesRemind400Error1"` [400] `V2InvoicingInvoicesRemind400Error1` · `"v2InvoicingInvoicesRemind403Error1"` [403] `V2InvoicingInvoicesRemind403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoicesRemind422Error1"` [422] `V2InvoicingInvoicesRemind422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesRemindRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `Notification` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Notification` | `notificationSchema` | `src/models/notification.ts` |
| `V2InvoicingInvoicesRemind400Error1` | `v2InvoicingInvoicesRemind400Error1Schema` | `src/models/v2-invoicing-invoices-remind400-error1.ts` |
| `V2InvoicingInvoicesRemind403Error1` | `v2InvoicingInvoicesRemind403Error1Schema` | `src/models/v2-invoicing-invoices-remind403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoicesRemind422Error1` | `v2InvoicingInvoicesRemind422Error1Schema` | `src/models/v2-invoicing-invoices-remind422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesSend

- **Signature**: `invoicesSend(request: InvoicesApi.InvoicesSendRequest, options?: RequestOptions): ApiPromise<LinkDescription1, InvoicesApi.InvoicesSendError>`
- **Wire**: `POST /v2/invoicing/invoices/{invoice_id}/send`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `LinkDescription1`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesSendError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"notFoundError"` [404] `NotFoundError` · `"unprocessableEntityError"` [422] `UnprocessableEntityError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesSendRequest` (2):

| Field | Channel | Wire | Type | Req |
| --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes |
| `body` | `body` | — | `Notification` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `Notification` | `notificationSchema` | `src/models/notification.ts` |
| `LinkDescription1` | `linkDescription1Schema` | `src/models/link-description1.ts` |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `UnprocessableEntityError` | `unprocessableEntityErrorSchema` | `src/models/unprocessable-entity-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicesUpdate

- **Signature**: `invoicesUpdate(request: InvoicesApi.InvoicesUpdateRequest, options?: RequestOptions): ApiPromise<Invoice, InvoicesApi.InvoicesUpdateError>`
- **Wire**: `PUT /v2/invoicing/invoices/{invoice_id}`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `Invoice`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicesUpdateError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"v2InvoicingInvoices400Error1"` [400] `V2InvoicingInvoices400Error1` · `"v2InvoicingInvoices403Error1"` [403] `V2InvoicingInvoices403Error1` · `"notFoundError"` [404] `NotFoundError` · `"v2InvoicingInvoices422Error1"` [422] `V2InvoicingInvoices422Error1` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicesUpdateRequest` (4):

| Field | Channel | Wire | Type | Req | Default |
| --- | --- | --- | --- | --- | --- |
| `invoiceId` | `path` | `invoice_id` | `string` | yes | — |
| `sendToRecipient` | `query` | `send_to_recipient` | `boolean` | no | `true` |
| `sendToInvoicer` | `query` | `send_to_invoicer` | `boolean` | no | `true` |
| `body` | `body` | — | `Invoice` | yes | — |

| Type | Schema value | Source |
| --- | --- | --- |
| `Invoice` | `invoiceSchema` | `src/models/invoice.ts` |
| `V2InvoicingInvoices400Error1` | `v2InvoicingInvoices400Error1Schema` | `src/models/v2-invoicing-invoices400-error1.ts` |
| `V2InvoicingInvoices403Error1` | `v2InvoicingInvoices403Error1Schema` | `src/models/v2-invoicing-invoices403-error1.ts` |
| `NotFoundError` | `notFoundErrorSchema` | `src/models/not-found-error.ts` |
| `V2InvoicingInvoices422Error1` | `v2InvoicingInvoices422Error1Schema` | `src/models/v2-invoicing-invoices422-error1.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

### invoicingGenerateNextInvoiceNumber

- **Signature**: `invoicingGenerateNextInvoiceNumber(request?: InvoicesApi.InvoicingGenerateNextInvoiceNumberRequest, options?: RequestOptions): ApiPromise<InvoiceNumber, InvoicesApi.InvoicingGenerateNextInvoiceNumberError>`
- **Wire**: `POST /v2/invoicing/generate-next-invoice-number`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `InvoiceNumber`
- **Error**: `InvoicesError` with `kind: "api"`, an instance of `InvoicesApi.InvoicingGenerateNextInvoiceNumberError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"badRequestError"` [400] `BadRequestError` · `"notAuthorizedError"` [403] `NotAuthorizedError` · `"internalServerError"` [500] `InternalServerError` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `InvoicesApi.InvoicingGenerateNextInvoiceNumberRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `FetchType` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `FetchType` | `fetchTypeSchema` | `src/models/fetch-type.ts` |
| `InvoiceNumber` | `invoiceNumberSchema` | `src/models/invoice-number.ts` |
| `BadRequestError` | `badRequestErrorSchema` | `src/models/bad-request-error.ts` |
| `NotAuthorizedError` | `notAuthorizedErrorSchema` | `src/models/not-authorized-error.ts` |
| `InternalServerError` | `internalServerErrorSchema` | `src/models/internal-server-error.ts` |

