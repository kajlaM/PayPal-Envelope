# Reference

> Source: [InvoicesClient](src/client.ts)

## InvoicesApi

> Source: [InvoicesApi](src/resources/invoices-api.ts)

<details>
<summary><code>invoicesCancel(request: InvoicesApi.InvoicesCancelRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesCancelError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Cancels a sent invoice, by ID, and, optionally, sends a notification about the cancellation to the payer, merchant, and CC: emails.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesCancel({ invoiceId: "some example string", body: {} });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesCancelError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesCancel({
  invoiceId: "some example string",
  body: {},
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body</code> | <code>[Notification](src/models/notification.ts)</code> | The email or SMS notification that will be sent to the payer on cancellation. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesCancel(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesCancelError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesCancel(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesCancelError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesCreate(request: InvoicesApi.InvoicesCreateRequest, options?: RequestOptions): ApiPromise&lt;Invoice, InvoicesApi.InvoicesCreateError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Creates a draft invoice. To move the invoice from a draft to payable state, you must <a href="#invoices_send">send the invoice</a>.<br/><br/>In the JSON request body, include invoice details including merchant information. The <code>invoice</code> object must include an <code>items</code> array.<blockquote><strong>Note:</strong> The merchant that you specify in an invoice must have a PayPal account in good standing.</blockquote>.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesCreate({ body: {} });
  // TODO: Handle 'response' of type Invoice
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesCreateError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesCreate({ body: {} }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Invoice
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[Invoice](src/models/invoice.ts)</code> | The invoice details which includes all information of the invoice like items, billing information. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesCreate(request)`

- **OnSuccess**: <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesCreateError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesCreate(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Invoice, InvoicesApi.InvoicesCreateError&gt;</code>, with `result.value` of type <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesDelete(request: InvoicesApi.InvoicesDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesDeleteError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes a draft or scheduled invoice, by ID. Deletes invoices in the draft or scheduled state only. For invoices that have already been sent, you can <a href="/docs/api/invoicing/v2/#invoices_cancel">cancel the invoice</a>. After you delete a draft or scheduled invoice, you can no longer use it or show its details. However, you can reuse its invoice number.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesDelete({ invoiceId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesDeleteError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesDelete({ invoiceId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesDeleteError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesDeleteError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesGenerateQrCode(request: InvoicesApi.InvoicesGenerateQrCodeRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesGenerateQrCodeError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Generates a QR code for an invoice, by ID. The QR code is a PNG image in <a href="https://www.base64encode.org/">Base64-encoded</a> format that corresponds to the invoice ID. You can generate a QR code for an invoice and add it to a paper or PDF invoice. When customers use their mobile devices to scan the QR code, they are redirected to the PayPal mobile payment flow where they can view the invoice and pay online with PayPal or a credit card. Before you get a QR code, you must <a href="#invoices_create">create an invoice</a> and <a href="#invoices_send">send an invoice</a> to move the invoice from a draft to payable state. Do not include an email address if you do not want the invoice emailed.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesGenerateQrCode({ invoiceId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesGenerateQrCodeError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesGenerateQrCode({
  invoiceId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body?</code> | <code>[QrConfiguration](src/models/qr-configuration.ts)</code> | Optional configuration parameters to adjust QR code width, height and the encoded URL. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesGenerateQrCode(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesGenerateQrCodeError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesGenerateQrCode(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesGenerateQrCodeError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesGet(request: InvoicesApi.InvoicesGetRequest, options?: RequestOptions): ApiPromise&lt;Invoice, InvoicesApi.InvoicesGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for an invoice, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesGet({ invoiceId: "some example string" });
  // TODO: Handle 'response' of type Invoice
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesGet({ invoiceId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Invoice
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesGet(request)`

- **OnSuccess**: <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesGetError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Invoice, InvoicesApi.InvoicesGetError&gt;</code>, with `result.value` of type <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesList(request?: InvoicesApi.InvoicesListRequest, options?: RequestOptions): ApiPromise&lt;Invoices, InvoicesApi.InvoicesListError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists invoices. To filter the invoices that appear in the response, you can specify one or more optional query parameters.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesList();
  // TODO: Handle 'response' of type Invoices
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesListError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Invoices
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>page?</code> | <code>number</code> | The page number to be retrieved, for the list of templates. So, a combination of `page=1` and `page_size=20` returns the first 20 templates. A combination of `page=2` and `page_size=20` returns the next 20 templates.<br>**Default**: 1 |
| <code>pageSize?</code> | <code>number</code> | The maximum number of templates to return in the response.<br>**Default**: 20 |
| <code>totalRequired?</code> | <code>boolean</code> | Indicates whether the to show <code>total_pages</code> and <code>total_items</code> in the response.<br>**Default**: false |
| <code>fields?</code> | <code>string</code> | The fields to return in the response. Value is `all` or `none`. To return only the template name, ID, and default attributes, specify `none`.<br>**Default**: "all" |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesList(request)`

- **OnSuccess**: <code>[Invoices](src/models/invoices.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesListError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesList(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Invoices, InvoicesApi.InvoicesListError&gt;</code>, with `result.value` of type <code>[Invoices](src/models/invoices.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesPayments(request: InvoicesApi.InvoicesPaymentsRequest, options?: RequestOptions): ApiPromise&lt;PaymentReference, InvoicesApi.InvoicesPaymentsError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Records a payment for the invoice. If no payment is due, the invoice is marked as `PAID`. Otherwise, the invoice is marked as `PARTIALLY PAID`.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesPayments({ invoiceId: "some example string", body: {} });
  // TODO: Handle 'response' of type PaymentReference
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesPaymentsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesPayments({
  invoiceId: "some example string",
  body: {},
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type PaymentReference
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body</code> | <code>[PaymentDetail](src/models/payment-detail.ts)</code> | The details of the payment to record against the invoice. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesPayments(request)`

- **OnSuccess**: <code>[PaymentReference](src/models/payment-reference.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesPaymentsError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesPayments(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;PaymentReference, InvoicesApi.InvoicesPaymentsError&gt;</code>, with `result.value` of type <code>[PaymentReference](src/models/payment-reference.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesPaymentsDelete(request: InvoicesApi.InvoicesPaymentsDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesPaymentsDeleteError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes an external payment, by invoice ID and transaction ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesPaymentsDelete({
    invoiceId: "some example string",
    transactionId: "some example string",
  });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesPaymentsDeleteError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesPaymentsDelete({
  invoiceId: "some example string",
  transactionId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>transactionId</code> | <code>string</code> | The ID of the external refund transaction to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesPaymentsDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesPaymentsDeleteError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesPaymentsDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesPaymentsDeleteError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesRefunds(request: InvoicesApi.InvoicesRefundsRequest, options?: RequestOptions): ApiPromise&lt;RefundPaymentReference, InvoicesApi.InvoicesRefundsError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Records a refund for the invoice. If all payments are refunded, the invoice is marked as `REFUNDED`. Otherwise, the invoice is marked as `PARTIALLY REFUNDED`.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesRefunds({ invoiceId: "some example string", body: {} });
  // TODO: Handle 'response' of type RefundPaymentReference
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesRefundsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesRefunds({
  invoiceId: "some example string",
  body: {},
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type RefundPaymentReference
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body</code> | <code>[RefundDetail](src/models/refund-detail.ts)</code> | The details of the refund to record against the invoice. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesRefunds(request)`

- **OnSuccess**: <code>[RefundPaymentReference](src/models/refund-payment-reference.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesRefundsError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesRefunds(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;RefundPaymentReference, InvoicesApi.InvoicesRefundsError&gt;</code>, with `result.value` of type <code>[RefundPaymentReference](src/models/refund-payment-reference.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesRefundsDelete(request: InvoicesApi.InvoicesRefundsDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesRefundsDeleteError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes an external refund, by invoice ID and transaction ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesRefundsDelete({
    invoiceId: "some example string",
    transactionId: "some example string",
  });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesRefundsDeleteError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesRefundsDelete({
  invoiceId: "some example string",
  transactionId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>transactionId</code> | <code>string</code> | The ID of the external refund transaction to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesRefundsDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesRefundsDeleteError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesRefundsDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesRefundsDeleteError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesRemind(request: InvoicesApi.InvoicesRemindRequest, options?: RequestOptions): ApiPromise&lt;undefined, InvoicesApi.InvoicesRemindError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Sends a reminder to the payer about an invoice, by ID. In the JSON request body, include a `notification` object that defines the subject of the reminder and other details. <blockquote><strong>Notes:</strong><ul><li>API caller can send only 2 reminders in a day.</li></ul></blockquote>.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.invoicesApi.invoicesRemind({ invoiceId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesRemindError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesRemind({ invoiceId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body?</code> | <code>[Notification](src/models/notification.ts)</code> | The email or SMS notification that will be sent to the payer for reminder. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesRemind(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesRemindError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesRemind(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, InvoicesApi.InvoicesRemindError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesSend(request: InvoicesApi.InvoicesSendRequest, options?: RequestOptions): ApiPromise&lt;LinkDescription1, InvoicesApi.InvoicesSendError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Sends or schedules an invoice, by ID, to be sent to a customer. The action depends on the invoice issue date:<ul><li>If the invoice issue date is current or in the past, sends the invoice immediately.</li><li>If the invoice issue date is in the future, schedules the invoice to be sent on that date.</li></ul>To suppress the merchant's email notification, set the `send_to_invoicer` body parameter to `false`. To send the invoice through a share link and not through PayPal, set the <code>send_to_recipient</code> parameter to <code>false</code> in the <code>notification</code> object. The <code>send_to_recipient</code> parameter does not apply to a future issue date because the invoice is scheduled to be sent through PayPal on that date.<blockquote><strong>Notes:</strong><ul><li>After you send an invoice, resending it has no effect.</li><li>To send a notification for updates, <a href="#invoices_update">update the invoice</a> and set the <code>send_to_recipient</code> body parameter to <code>true</code>.</li></ul></blockquote>

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesSend({ invoiceId: "some example string" });
  // TODO: Handle 'response' of type LinkDescription1
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesSendError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesSend({ invoiceId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type LinkDescription1
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>body?</code> | <code>[Notification](src/models/notification.ts)</code> | The email or SMS notification to send to the payer when they send an invoice.. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesSend(request)`

- **OnSuccess**: <code>[LinkDescription1](src/models/link-description1.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesSendError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesSend(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;LinkDescription1, InvoicesApi.InvoicesSendError&gt;</code>, with `result.value` of type <code>[LinkDescription1](src/models/link-description1.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicesUpdate(request: InvoicesApi.InvoicesUpdateRequest, options?: RequestOptions): ApiPromise&lt;Invoice, InvoicesApi.InvoicesUpdateError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Fully updates an invoice, by ID. In the JSON request body, include a complete `invoice` object. This call does not support partial updates. <blockquote><strong>Notes:</strong><ul><li>API caller can change/modify recipient only 2 times in 72 hours.</li></ul></blockquote>.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicesUpdate({ invoiceId: "some example string", body: {} });
  // TODO: Handle 'response' of type Invoice
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicesUpdateError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicesUpdate({
  invoiceId: "some example string",
  body: {},
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Invoice
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>invoiceId</code> | <code>string</code> | The ID of the draft invoice to delete. |
| <code>sendToRecipient?</code> | <code>boolean</code> | Indicates whether to send the invoice update notification to the recipient.<br>**Default**: true |
| <code>sendToInvoicer?</code> | <code>boolean</code> | Indicates whether to send the invoice update notification to the merchant.<br>**Default**: true |
| <code>body</code> | <code>[Invoice](src/models/invoice.ts)</code> | A representation of changes to make in the invoice. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicesUpdate(request)`

- **OnSuccess**: <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicesUpdateError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicesUpdate(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Invoice, InvoicesApi.InvoicesUpdateError&gt;</code>, with `result.value` of type <code>[Invoice](src/models/invoice.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>invoicingGenerateNextInvoiceNumber(request?: InvoicesApi.InvoicingGenerateNextInvoiceNumberRequest, options?: RequestOptions): ApiPromise&lt;InvoiceNumber, InvoicesApi.InvoicingGenerateNextInvoiceNumberError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Generates the next invoice number that is available to the merchant. The next invoice number uses the prefix and suffix from the last invoice number and increments the number by one. For example, the next invoice number after `INVOICE-1234` is `INVOICE-1235`.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoicesApi.invoicingGenerateNextInvoiceNumber();
  // TODO: Handle 'response' of type InvoiceNumber
} catch (err) {
  // TODO: Handle 'err' of type InvoicesApi.InvoicingGenerateNextInvoiceNumberError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoicesApi.invoicingGenerateNextInvoiceNumber().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type InvoiceNumber
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body?</code> | <code>[FetchType](src/models/fetch-type.ts)</code> | Is the fetch type invoice number or id. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoicesApi.invoicingGenerateNextInvoiceNumber(request)`

- **OnSuccess**: <code>[InvoiceNumber](src/models/invoice-number.ts)</code>
- **OnError**: throws <code>[InvoicesApi.InvoicingGenerateNextInvoiceNumberError](src/resources/invoices-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoicesApi.invoicingGenerateNextInvoiceNumber(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;InvoiceNumber, InvoicesApi.InvoicingGenerateNextInvoiceNumberError&gt;</code>, with `result.value` of type <code>[InvoiceNumber](src/models/invoice-number.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## SearchInvoices

> Source: [SearchInvoices](src/resources/search-invoices.ts)

<details>
<summary><code>invoicesSearchInvoices(request?: SearchInvoices.InvoicesSearchInvoicesRequest, options?: RequestOptions): ApiPromise&lt;Invoices, SearchInvoices.InvoicesSearchInvoicesError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Searches for and lists invoices that match search criteria. If you pass multiple criteria, the response lists invoices that match all criteria.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.searchInvoices.invoicesSearchInvoices();
  // TODO: Handle 'response' of type Invoices
} catch (err) {
  // TODO: Handle 'err' of type SearchInvoices.InvoicesSearchInvoicesError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.searchInvoices.invoicesSearchInvoices().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Invoices
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>page?</code> | <code>number</code> | The page number to be retrieved, for the list of templates. So, a combination of `page=1` and `page_size=20` returns the first 20 templates. A combination of `page=2` and `page_size=20` returns the next 20 templates.<br>**Default**: 1 |
| <code>pageSize?</code> | <code>number</code> | The maximum number of templates to return in the response.<br>**Default**: 20 |
| <code>totalRequired?</code> | <code>boolean</code> | Indicates whether the to show <code>total_pages</code> and <code>total_items</code> in the response.<br>**Default**: false |
| <code>body?</code> | <code>[SearchData](src/models/search-data.ts)</code> | The invoice search can be used to retrieve the invoices based on the search parameters. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.searchInvoices.invoicesSearchInvoices(request)`

- **OnSuccess**: <code>[Invoices](src/models/invoices.ts)</code>
- **OnError**: throws <code>[SearchInvoices.InvoicesSearchInvoicesError](src/resources/search-invoices.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.searchInvoices.invoicesSearchInvoices(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Invoices, SearchInvoices.InvoicesSearchInvoicesError&gt;</code>, with `result.value` of type <code>[Invoices](src/models/invoices.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## TemplatesApi

> Source: [TemplatesApi](src/resources/templates-api.ts)

<details>
<summary><code>templatesCreate(request: TemplatesApi.TemplatesCreateRequest, options?: RequestOptions): ApiPromise&lt;Template, TemplatesApi.TemplatesCreateError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Creates an invoice template. You can use details from this template to create an invoice. You can create up to 50 templates.<blockquote><strong>Note:</strong> Every merchant starts with three PayPal system templates that are optimized for the unit type billed. The template includes `Quantity`, `Hours`, and `Amount`.</blockquote>

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.templatesApi.templatesCreate({ body: {} });
  // TODO: Handle 'response' of type Template
} catch (err) {
  // TODO: Handle 'err' of type TemplatesApi.TemplatesCreateError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.templatesApi.templatesCreate({ body: {} }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Template
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[Template](src/models/template.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.templatesApi.templatesCreate(request)`

- **OnSuccess**: <code>[Template](src/models/template.ts)</code>
- **OnError**: throws <code>[TemplatesApi.TemplatesCreateError](src/resources/templates-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.templatesApi.templatesCreate(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Template, TemplatesApi.TemplatesCreateError&gt;</code>, with `result.value` of type <code>[Template](src/models/template.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>templatesDelete(request: TemplatesApi.TemplatesDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, TemplatesApi.TemplatesDeleteError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes a template, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.templatesApi.templatesDelete({ templateId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type TemplatesApi.TemplatesDeleteError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.templatesApi.templatesDelete({ templateId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>templateId</code> | <code>string</code> | The ID of the template to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.templatesApi.templatesDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[TemplatesApi.TemplatesDeleteError](src/resources/templates-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.templatesApi.templatesDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, TemplatesApi.TemplatesDeleteError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>templatesGet(request: TemplatesApi.TemplatesGetRequest, options?: RequestOptions): ApiPromise&lt;Template, TemplatesApi.TemplatesGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for a template, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.templatesApi.templatesGet({ templateId: "some example string" });
  // TODO: Handle 'response' of type Template
} catch (err) {
  // TODO: Handle 'err' of type TemplatesApi.TemplatesGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.templatesApi.templatesGet({ templateId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Template
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>templateId</code> | <code>string</code> | The ID of the template to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.templatesApi.templatesGet(request)`

- **OnSuccess**: <code>[Template](src/models/template.ts)</code>
- **OnError**: throws <code>[TemplatesApi.TemplatesGetError](src/resources/templates-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.templatesApi.templatesGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Template, TemplatesApi.TemplatesGetError&gt;</code>, with `result.value` of type <code>[Template](src/models/template.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>templatesList(request?: TemplatesApi.TemplatesListRequest, options?: RequestOptions): ApiPromise&lt;Templates, TemplatesApi.TemplatesListError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists merchant-created templates with associated details. The associated details include the emails, addresses, and phone numbers from the user's PayPal profile.<br/>The user can select which values to show in the business information section of their template.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.templatesApi.templatesList();
  // TODO: Handle 'response' of type Templates
} catch (err) {
  // TODO: Handle 'err' of type TemplatesApi.TemplatesListError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.templatesApi.templatesList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Templates
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>fields?</code> | <code>string</code> | The fields to return in the response. Value is `all` or `none`. To return only the template name, ID, and default attributes, specify `none`.<br>**Default**: "all" |
| <code>page?</code> | <code>number</code> | The page number to be retrieved, for the list of templates. So, a combination of `page=1` and `page_size=20` returns the first 20 templates. A combination of `page=2` and `page_size=20` returns the next 20 templates.<br>**Default**: 1 |
| <code>pageSize?</code> | <code>number</code> | The maximum number of templates to return in the response.<br>**Default**: 20 |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.templatesApi.templatesList(request)`

- **OnSuccess**: <code>[Templates](src/models/templates.ts)</code>
- **OnError**: throws <code>[TemplatesApi.TemplatesListError](src/resources/templates-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.templatesApi.templatesList(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Templates, TemplatesApi.TemplatesListError&gt;</code>, with `result.value` of type <code>[Templates](src/models/templates.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>templatesUpdate(request: TemplatesApi.TemplatesUpdateRequest, options?: RequestOptions): ApiPromise&lt;Template, TemplatesApi.TemplatesUpdateError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Fully updates a template, by ID. In the JSON request body, include a complete `template` object. This call does not support partial updates.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.templatesApi.templatesUpdate({ templateId: "some example string", body: {} });
  // TODO: Handle 'response' of type Template
} catch (err) {
  // TODO: Handle 'err' of type TemplatesApi.TemplatesUpdateError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.templatesApi.templatesUpdate({
  templateId: "some example string",
  body: {},
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Template
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>templateId</code> | <code>string</code> | The ID of the template to delete. |
| <code>body</code> | <code>[Template](src/models/template.ts)</code> | A representation of changes to make in the template. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.templatesApi.templatesUpdate(request)`

- **OnSuccess**: <code>[Template](src/models/template.ts)</code>
- **OnError**: throws <code>[TemplatesApi.TemplatesUpdateError](src/resources/templates-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.templatesApi.templatesUpdate(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Template, TemplatesApi.TemplatesUpdateError&gt;</code>, with `result.value` of type <code>[Template](src/models/template.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## ConnectionsApi

> Source: [ConnectionsApi](src/resources/connections-api.ts)

<details>
<summary><code>connectionsGet(options?: RequestOptions): ApiPromise&lt;Connections1, ConnectionsApi.ConnectionsGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists connections to accounting platforms per merchant.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.connectionsApi.connectionsGet();
  // TODO: Handle 'response' of type Connections1
} catch (err) {
  // TODO: Handle 'err' of type ConnectionsApi.ConnectionsGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.connectionsApi.connectionsGet().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Connections1
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.connectionsApi.connectionsGet()`

- **OnSuccess**: <code>[Connections1](src/models/connections1.ts)</code>
- **OnError**: throws <code>[ConnectionsApi.ConnectionsGetError](src/resources/connections-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.connectionsApi.connectionsGet().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Connections1, ConnectionsApi.ConnectionsGetError&gt;</code>, with `result.value` of type <code>[Connections1](src/models/connections1.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## InvoiceConnectionDetailsApi

> Source: [InvoiceConnectionDetailsApi](src/resources/invoice-connection-details-api.ts)

<details>
<summary><code>invoiceConnectionDetailsGet(request: InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetRequest, options?: RequestOptions): ApiPromise&lt;InvoiceConnectionDetails, InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists connections to accounting platforms per invoice.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.invoiceConnectionDetailsApi.invoiceConnectionDetailsGet({
    id: "some example string",
  });
  // TODO: Handle 'response' of type InvoiceConnectionDetails
} catch (err) {
  // TODO: Handle 'err' of type InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.invoiceConnectionDetailsApi.invoiceConnectionDetailsGet({
  id: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type InvoiceConnectionDetails
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | The invoice id of the account. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.invoiceConnectionDetailsApi.invoiceConnectionDetailsGet(request)`

- **OnSuccess**: <code>[InvoiceConnectionDetails](src/models/invoice-connection-details.ts)</code>
- **OnError**: throws <code>[InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError](src/resources/invoice-connection-details-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.invoiceConnectionDetailsApi.invoiceConnectionDetailsGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;InvoiceConnectionDetails, InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError&gt;</code>, with `result.value` of type <code>[InvoiceConnectionDetails](src/models/invoice-connection-details.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Webhooks

> Source: [Webhooks](src/resources/webhooks.ts)

<details>
<summary><code>eventTypesList(request: Webhooks.EventTypesListRequest, options?: RequestOptions): ApiPromise&lt;EventTypeList, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists event subscriptions for a webhook, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooks.eventTypesList({ webhookId: "some example string" });
  // TODO: Handle 'response' of type EventTypeList
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.eventTypesList({ webhookId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type EventTypeList
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookId</code> | <code>string</code> | The ID of the webhook for which to list subscriptions. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.eventTypesList(request)`

- **OnSuccess**: <code>[EventTypeList](src/models/event-type-list.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.eventTypesList(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;EventTypeList, ApiError&gt;</code>, with `result.value` of type <code>[EventTypeList](src/models/event-type-list.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksDelete(request: Webhooks.WebhooksDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes a webhook, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.webhooks.webhooksDelete({ webhookId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.webhooksDelete({ webhookId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookId</code> | <code>string</code> | The ID of the webhook for which to list subscriptions. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.webhooksDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.webhooksDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, ApiError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksGet(request: Webhooks.WebhooksGetRequest, options?: RequestOptions): ApiPromise&lt;Webhook, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for a webhook, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooks.webhooksGet({ webhookId: "some example string" });
  // TODO: Handle 'response' of type Webhook
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.webhooksGet({ webhookId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Webhook
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookId</code> | <code>string</code> | The ID of the webhook for which to list subscriptions. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.webhooksGet(request)`

- **OnSuccess**: <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.webhooksGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Webhook, ApiError&gt;</code>, with `result.value` of type <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksList(request?: Webhooks.WebhooksListRequest, options?: RequestOptions): ApiPromise&lt;WebhookList, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists webhooks for an app.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooks.webhooksList();
  // TODO: Handle 'response' of type WebhookList
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.webhooksList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type WebhookList
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>anchorType?</code> | <code>[AnchorType](src/models/anchor-type.ts)</code> | Filters the webhooks in the response by an `anchor_id` entity type.<br>**Default**: "APPLICATION" |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.webhooksList(request)`

- **OnSuccess**: <code>[WebhookList](src/models/webhook-list.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.webhooksList(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;WebhookList, ApiError&gt;</code>, with `result.value` of type <code>[WebhookList](src/models/webhook-list.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksPost(request?: Webhooks.WebhooksPostRequest, options?: RequestOptions): ApiPromise&lt;Webhook, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Subscribes your webhook listener to events.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooks.webhooksPost({
    body: {
      url: "https://example.com/example_webhook",
      eventTypes: [{ name: "PAYMENT.AUTHORIZATION.CREATED" }, { name: "PAYMENT.AUTHORIZATION.VOIDED" }],
    },
  });
  // TODO: Handle 'response' of type Webhook
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.webhooksPost({
  body: {
    url: "https://example.com/example_webhook",
    eventTypes: [{ name: "PAYMENT.AUTHORIZATION.CREATED" }, { name: "PAYMENT.AUTHORIZATION.VOIDED" }],
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Webhook
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body?</code> | <code>[Webhook](src/models/webhook.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.webhooksPost(request)`

- **OnSuccess**: <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.webhooksPost(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Webhook, ApiError&gt;</code>, with `result.value` of type <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksUpdate(request: Webhooks.WebhooksUpdateRequest, options?: RequestOptions): ApiPromise&lt;Webhook, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Updates a webhook to replace webhook fields with new values. Supports only the `replace` operation. Pass a `json_patch` object with `replace` operation and `path`, which is `/url` for a URL or `/event_types` for events. The `value` is either the URL or a list of events.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooks.webhooksUpdate({ webhookId: "some example string" });
  // TODO: Handle 'response' of type Webhook
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooks.webhooksUpdate({ webhookId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Webhook
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookId</code> | <code>string</code> | The ID of the webhook for which to list subscriptions. |
| <code>body?</code> | <code>[Patch](src/models/patch.ts)[]</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooks.webhooksUpdate(request)`

- **OnSuccess**: <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooks.webhooksUpdate(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Webhook, ApiError&gt;</code>, with `result.value` of type <code>[Webhook](src/models/webhook.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## WebhooksLookup

> Source: [WebhooksLookup](src/resources/webhooks-lookup.ts)

<details>
<summary><code>webhooksLookupDelete(request: WebhooksLookup.WebhooksLookupDeleteRequest, options?: RequestOptions): ApiPromise&lt;undefined, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Deletes a webhook lookup, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  await client.webhooksLookup.webhooksLookupDelete({ webhookLookupId: "some example string" });
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksLookup.webhooksLookupDelete({
  webhookLookupId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: The call succeeded and resolves to no body
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookLookupId</code> | <code>string</code> | The ID of the webhook lookup to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksLookup.webhooksLookupDelete(request)`

- **OnSuccess**: <code>undefined</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksLookup.webhooksLookupDelete(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;undefined, ApiError&gt;</code>, with `result.value` of type <code>undefined</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksLookupGet(request: WebhooksLookup.WebhooksLookupGetRequest, options?: RequestOptions): ApiPromise&lt;WebhookLookup, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for a webhook lookup, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksLookup.webhooksLookupGet({ webhookLookupId: "some example string" });
  // TODO: Handle 'response' of type WebhookLookup
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksLookup.webhooksLookupGet({
  webhookLookupId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type WebhookLookup
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>webhookLookupId</code> | <code>string</code> | The ID of the webhook lookup to delete. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksLookup.webhooksLookupGet(request)`

- **OnSuccess**: <code>[WebhookLookup](src/models/webhook-lookup.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksLookup.webhooksLookupGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;WebhookLookup, ApiError&gt;</code>, with `result.value` of type <code>[WebhookLookup](src/models/webhook-lookup.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksLookupList(options?: RequestOptions): ApiPromise&lt;WebhookLookupList, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists webhook lookups.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksLookup.webhooksLookupList();
  // TODO: Handle 'response' of type WebhookLookupList
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksLookup.webhooksLookupList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type WebhookLookupList
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksLookup.webhooksLookupList()`

- **OnSuccess**: <code>[WebhookLookupList](src/models/webhook-lookup-list.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksLookup.webhooksLookupList().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;WebhookLookupList, ApiError&gt;</code>, with `result.value` of type <code>[WebhookLookupList](src/models/webhook-lookup-list.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksLookupPost(options?: RequestOptions): ApiPromise&lt;WebhookLookup, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Creates a webhook lookup. A webhook lookup ties the API caller's REST API app to the subject account (or, if no subject is specified, to the API caller's account). If a webhook event is generated for an event that is tied to the account but not to a particular REST API app (for example, payments initiated with the NVP/SOAP APIs or through the user interface on PayPal.com), those webhook events will treated as if they were intended for the REST API app registered in the webhook lookup instead. Webhook events will then be delivered to any webhooks registered to that REST API app.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksLookup.webhooksLookupPost();
  // TODO: Handle 'response' of type WebhookLookup
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksLookup.webhooksLookupPost().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type WebhookLookup
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksLookup.webhooksLookupPost()`

- **OnSuccess**: <code>[WebhookLookup](src/models/webhook-lookup.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksLookup.webhooksLookupPost().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;WebhookLookup, ApiError&gt;</code>, with `result.value` of type <code>[WebhookLookup](src/models/webhook-lookup.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## VerifyWebhookSignatureApi

> Source: [VerifyWebhookSignatureApi](src/resources/verify-webhook-signature-api.ts)

<details>
<summary><code>verifyWebhookSignaturePost(request?: VerifyWebhookSignatureApi.VerifyWebhookSignaturePostRequest, options?: RequestOptions): ApiPromise&lt;VerifyWebhookSignatureResponse, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Verifies a webhook signature.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.verifyWebhookSignatureApi.verifyWebhookSignaturePost();
  // TODO: Handle 'response' of type VerifyWebhookSignatureResponse
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.verifyWebhookSignatureApi.verifyWebhookSignaturePost().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type VerifyWebhookSignatureResponse
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body?</code> | <code>[VerifyWebhookSignature](src/models/verify-webhook-signature.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.verifyWebhookSignatureApi.verifyWebhookSignaturePost(request)`

- **OnSuccess**: <code>[VerifyWebhookSignatureResponse](src/models/verify-webhook-signature-response.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.verifyWebhookSignatureApi.verifyWebhookSignaturePost(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;VerifyWebhookSignatureResponse, ApiError&gt;</code>, with `result.value` of type <code>[VerifyWebhookSignatureResponse](src/models/verify-webhook-signature-response.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## WebhooksEventTypes

> Source: [WebhooksEventTypes](src/resources/webhooks-event-types.ts)

<details>
<summary><code>webhooksEventTypesList(options?: RequestOptions): ApiPromise&lt;EventTypeList, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists available events to which any webhook can subscribe. For a list of supported events, see [Webhook event names](/docs/api/notifications/webhooks/event-names/).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksEventTypes.webhooksEventTypesList();
  // TODO: Handle 'response' of type EventTypeList
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksEventTypes.webhooksEventTypesList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type EventTypeList
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksEventTypes.webhooksEventTypesList()`

- **OnSuccess**: <code>[EventTypeList](src/models/event-type-list.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksEventTypes.webhooksEventTypesList().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;EventTypeList, ApiError&gt;</code>, with `result.value` of type <code>[EventTypeList](src/models/event-type-list.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## WebhooksEvents

> Source: [WebhooksEvents](src/resources/webhooks-events.ts)

<details>
<summary><code>webhooksEventsGet(request: WebhooksEvents.WebhooksEventsGetRequest, options?: RequestOptions): ApiPromise&lt;Event, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for a webhooks event notification, by ID.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksEvents.webhooksEventsGet({ eventId: "some example string" });
  // TODO: Handle 'response' of type Event
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksEvents.webhooksEventsGet({
  eventId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Event
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>eventId</code> | <code>string</code> | The ID of the webhook event notification to resend. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksEvents.webhooksEventsGet(request)`

- **OnSuccess**: <code>[Event](src/models/event.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksEvents.webhooksEventsGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Event, ApiError&gt;</code>, with `result.value` of type <code>[Event](src/models/event.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksEventsList(request?: WebhooksEvents.WebhooksEventsListRequest, options?: RequestOptions): ApiPromise&lt;EventList, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Lists webhooks event notifications. Use query parameters to filter the response.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksEvents.webhooksEventsList();
  // TODO: Handle 'response' of type EventList
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksEvents.webhooksEventsList().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type EventList
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>pageSize?</code> | <code>number</code> | The number of webhook event notifications to return in the response.<br>**Default**: 10 |
| <code>startTime?</code> | <code>string</code> | Filters the webhook event notifications in the response to those created on or after this date and time and on or before the `end_time` value. Both values are in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6) format. Example: `start_time=2013-03-06T11:00:00Z`. |
| <code>endTime?</code> | <code>string</code> | Filters the webhook event notifications in the response to those created on or after the `start_time` and on or before this date and time. Both values are in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6) format. Example: `end_time=2013-03-06T11:00:00Z`. |
| <code>transactionId?</code> | <code>string</code> | Filters the response to a single transaction, by ID. |
| <code>eventType?</code> | <code>string</code> | Filters the response to a single event. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksEvents.webhooksEventsList(request)`

- **OnSuccess**: <code>[EventList](src/models/event-list.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksEvents.webhooksEventsList(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;EventList, ApiError&gt;</code>, with `result.value` of type <code>[EventList](src/models/event-list.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>webhooksEventsResend(request: WebhooksEvents.WebhooksEventsResendRequest, options?: RequestOptions): ApiPromise&lt;Event, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Resends a webhook event notification, by ID. Any pending notifications are not resent.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.webhooksEvents.webhooksEventsResend({ eventId: "some example string" });
  // TODO: Handle 'response' of type Event
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.webhooksEvents.webhooksEventsResend({
  eventId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Event
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>eventId</code> | <code>string</code> | The ID of the webhook event notification to resend. |
| <code>body?</code> | <code>[EventResend](src/models/event-resend.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.webhooksEvents.webhooksEventsResend(request)`

- **OnSuccess**: <code>[Event](src/models/event.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.webhooksEvents.webhooksEventsResend(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Event, ApiError&gt;</code>, with `result.value` of type <code>[Event](src/models/event.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## SimulateEventApi

> Source: [SimulateEventApi](src/resources/simulate-event-api.ts)

<details>
<summary><code>simulateEventPost(request?: SimulateEventApi.SimulateEventPostRequest, options?: RequestOptions): ApiPromise&lt;Event, ApiError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Simulates a webhook event. In the JSON request body, specify a sample payload.<br>You need to subscribe to the following webhook events for Pay upon Invoice:<br><table><thead><tr><th>Event</th><th>Trigger</th></tr></thead><tbody><tr><td><code>PAYMENT.CAPTURE.COMPLETED</code></td><td>A payment capture completes.</td></tr><tr><td><code>PAYMENT.CAPTURE.DENIED</code></td><td>A payment capture is denied.</td></tr><tr><td><code>CHECKOUT.PAYMENT-APPROVAL.REVERSED</code></td><td>PayPal reverses a payment capture.</td></tr></tbody></table>

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.simulateEventApi.simulateEventPost({
    body: {
      url: "https://example.com/example_webhook",
      eventType: "PAYMENT.AUTHORIZATION.CREATED",
      resourceVersion: "1.0",
    },
  });
  // TODO: Handle 'response' of type Event
} catch (err) {
  // TODO: Handle 'err' of type ApiError, where 'err.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.simulateEventApi.simulateEventPost({
  body: {
    url: "https://example.com/example_webhook",
    eventType: "PAYMENT.AUTHORIZATION.CREATED",
    resourceVersion: "1.0",
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Event
} else {
  // TODO: Handle 'result', where 'result.payload' is always the Undeclared arm
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body?</code> | <code>[SimulateEvent](src/models/simulate-event.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.simulateEventApi.simulateEventPost(request)`

- **OnSuccess**: <code>[Event](src/models/event.ts)</code>
- **OnError**: throws <code>[ApiError](src/core/api-error.ts)</code>, with `err.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm

**As ApiResult**: `await client.simulateEventApi.simulateEventPost(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Event, ApiError&gt;</code>, with `result.value` of type <code>[Event](src/models/event.ts)</code>
- **OnError**: `result.payload` always the <code>[Undeclared](src/core/api-error.ts)</code> arm, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Payouts

> Source: [Payouts](src/resources/payouts.ts)

<details>
<summary><code>payoutsGet(request: Payouts.PayoutsGetRequest, options?: RequestOptions): ApiPromise&lt;PayoutBatch, Payouts.PayoutsGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows the latest status of a batch payout. Includes the transaction status and other data for individual payout items.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.payouts.payoutsGet({ id: "some example string" });
  // TODO: Handle 'response' of type PayoutBatch
} catch (err) {
  // TODO: Handle 'err' of type Payouts.PayoutsGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.payouts.payoutsGet({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type PayoutBatch
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | The ID of the payout for which to show details. |
| <code>fields?</code> | <code>string</code> | Shows details for only the specified fields. |
| <code>page?</code> | <code>number</code> | A non-zero integer representing the page of the results.<br>**Default**: 1 |
| <code>pageSize?</code> | <code>number</code> | The maximum number of results to return at one time. Value is a non-negative, non-zero integer. If the user chooses pagination, the maximum page is `1000`. |
| <code>totalRequired?</code> | <code>boolean</code> | Indicates whether to show the total items and total pages count in the response.<br>**Default**: false |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.payouts.payoutsGet(request)`

- **OnSuccess**: <code>[PayoutBatch](src/models/payout-batch.ts)</code>
- **OnError**: throws <code>[Payouts.PayoutsGetError](src/resources/payouts.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.payouts.payoutsGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;PayoutBatch, Payouts.PayoutsGetError&gt;</code>, with `result.value` of type <code>[PayoutBatch](src/models/payout-batch.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>payoutsPost(request?: Payouts.PayoutsPostRequest, options?: RequestOptions): ApiPromise&lt;CreatePayoutResponse, Payouts.PayoutsPostError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Creates a batch payout. In the JSON request body, pass a `sender_batch_header` and an `items` array. The `sender_batch_header` defines how to handle the payout. The `items` array defines the payout items.<br/>You can make payouts to one or more recipients.<blockquote><strong>Notes:</strong> <ul><li><p>PayPal does not process duplicate payouts. If you specify a <code>sender_batch_id</code> that was used in the last 30 days, the API rejects the request with an error message that shows the duplicate <code>sender_batch_id</code> and includes a HATEOAS link to the original payout with the same <code>sender_batch_id</code>.</p><p>If you receive an HTTP <code>5<i>nn</i></code> status code, you can safely retry the request with the same <code>sender_batch_id</code>.</p></li><li><p>The Payouts API does not support build notation (BN) codes. In a future Payouts release, you can optionally provide BN codes in the <code>PayPal-Partner-Attribution-Id</code> request header.</p><p>For information about the <code>PayPal-Partner-Attribution-Id</code> header, see <a href="/api/rest/requests/#http-request-headers">HTTP request headers</a>. To learn about or request a BN code, contact your partner manager or see <a href="https://www.paypal.com/us/webapps/mpp/partner-program">PayPal Partner Program</a>.</p></li></ul></blockquote>

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.payouts.payoutsPost({
    body: {
      senderBatchHeader: {
        senderBatchId: "Payouts_2018_100007",
        emailSubject: "You have a payout!",
        emailMessage: "You have received a payout! Thanks for using our service!",
      },
      items: [
        {
          recipientType: "EMAIL",
          amount: { currency: "USD", value: "9.87" },
          note: "Thanks for your patronage!",
          receiver: "receiver@example.com",
          senderItemId: "201403140001",
          alternateNotificationMethod: { phone: {} },
          notificationLanguage: "fr-FR",
        },
        {
          recipientType: "PHONE",
          amount: { currency: "USD", value: "112.34" },
          note: "Thanks for your support!",
          receiver: "91-734-234-1234",
          senderItemId: "201403140002",
        },
        {
          recipientType: "PAYPAL_ID",
          amount: { currency: "USD", value: "5.32" },
          note: "Thanks for your patronage!",
          receiver: "G83JXTJ5EHCQ2",
          senderItemId: "201403140003",
        },
      ],
    },
  });
  // TODO: Handle 'response' of type CreatePayoutResponse
} catch (err) {
  // TODO: Handle 'err' of type Payouts.PayoutsPostError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.payouts.payoutsPost({
  body: {
    senderBatchHeader: {
      senderBatchId: "Payouts_2018_100007",
      emailSubject: "You have a payout!",
      emailMessage: "You have received a payout! Thanks for using our service!",
    },
    items: [
      {
        recipientType: "EMAIL",
        amount: { currency: "USD", value: "9.87" },
        note: "Thanks for your patronage!",
        receiver: "receiver@example.com",
        senderItemId: "201403140001",
        alternateNotificationMethod: { phone: {} },
        notificationLanguage: "fr-FR",
      },
      {
        recipientType: "PHONE",
        amount: { currency: "USD", value: "112.34" },
        note: "Thanks for your support!",
        receiver: "91-734-234-1234",
        senderItemId: "201403140002",
      },
      {
        recipientType: "PAYPAL_ID",
        amount: { currency: "USD", value: "5.32" },
        note: "Thanks for your patronage!",
        receiver: "G83JXTJ5EHCQ2",
        senderItemId: "201403140003",
      },
    ],
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type CreatePayoutResponse
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>payPalRequestId?</code> | <code>string</code> | The server stores keys for 30 days. |
| <code>body?</code> | <code>[CreatePayoutRequest](src/models/create-payout-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.payouts.payoutsPost(request)`

- **OnSuccess**: <code>[CreatePayoutResponse](src/models/create-payout-response.ts)</code>
- **OnError**: throws <code>[Payouts.PayoutsPostError](src/resources/payouts.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.payouts.payoutsPost(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;CreatePayoutResponse, Payouts.PayoutsPostError&gt;</code>, with `result.value` of type <code>[CreatePayoutResponse](src/models/create-payout-response.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## PayoutsItem

> Source: [PayoutsItem](src/resources/payouts-item.ts)

<details>
<summary><code>payoutsItemCancel(request: PayoutsItem.PayoutsItemCancelRequest, options?: RequestOptions): ApiPromise&lt;PayoutItem2, PayoutsItem.PayoutsItemCancelError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Cancels an unclaimed payout item, by ID. If no one claims the unclaimed item within 30 days, the API automatically returns the funds to the sender. Use this call to cancel the unclaimed item before the automatic 30-day refund. You can cancel payout items with a <code>transaction_status</code> of <code>UNCLAIMED</code>.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.payoutsItem.payoutsItemCancel({ payoutItemId: "some example string" });
  // TODO: Handle 'response' of type PayoutItem2
} catch (err) {
  // TODO: Handle 'err' of type PayoutsItem.PayoutsItemCancelError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.payoutsItem.payoutsItemCancel({
  payoutItemId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type PayoutItem2
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>payoutItemId</code> | <code>string</code> | The ID of the payout item to cancel. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.payoutsItem.payoutsItemCancel(request)`

- **OnSuccess**: <code>[PayoutItem2](src/models/payout-item2.ts)</code>
- **OnError**: throws <code>[PayoutsItem.PayoutsItemCancelError](src/resources/payouts-item.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.payoutsItem.payoutsItemCancel(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;PayoutItem2, PayoutsItem.PayoutsItemCancelError&gt;</code>, with `result.value` of type <code>[PayoutItem2](src/models/payout-item2.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>payoutsItemGet(request: PayoutsItem.PayoutsItemGetRequest, options?: RequestOptions): ApiPromise&lt;PayoutItem2, PayoutsItem.PayoutsItemGetError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Shows details for a payout item, by ID. A <code>payout_item_id</code> helps you identify denied payments. If a payment is denied, you can use the <code>payout_item_id</code> to identify the payment even if it lacks a <code>transaction_id</code>.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.payoutsItem.payoutsItemGet({ payoutItemId: "some example string" });
  // TODO: Handle 'response' of type PayoutItem2
} catch (err) {
  // TODO: Handle 'err' of type PayoutsItem.PayoutsItemGetError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.payoutsItem.payoutsItemGet({ payoutItemId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type PayoutItem2
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>payoutItemId</code> | <code>string</code> | The ID of the payout item to cancel. |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.payoutsItem.payoutsItemGet(request)`

- **OnSuccess**: <code>[PayoutItem2](src/models/payout-item2.ts)</code>
- **OnError**: throws <code>[PayoutsItem.PayoutsItemGetError](src/resources/payouts-item.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.payoutsItem.payoutsItemGet(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;PayoutItem2, PayoutsItem.PayoutsItemGetError&gt;</code>, with `result.value` of type <code>[PayoutItem2](src/models/payout-item2.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[InvoicesError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

