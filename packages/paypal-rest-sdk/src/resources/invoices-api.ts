import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { badRequestErrorSchema, type BadRequestError } from "../models/bad-request-error.js";
import { fetchTypeSchema, type FetchType } from "../models/fetch-type.js";
import { internalServerErrorSchema, type InternalServerError } from "../models/internal-server-error.js";
import { invoiceNumberSchema, type InvoiceNumber } from "../models/invoice-number.js";
import { invoiceSchema, type Invoice } from "../models/invoice.js";
import { invoicesSchema, type Invoices } from "../models/invoices.js";
import { linkDescription1Schema, type LinkDescription1 } from "../models/link-description1.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../models/not-authorized-error.js";
import { notFoundErrorSchema, type NotFoundError } from "../models/not-found-error.js";
import { notificationSchema, type Notification } from "../models/notification.js";
import { paymentDetailSchema, type PaymentDetail } from "../models/payment-detail.js";
import { paymentReferenceSchema, type PaymentReference } from "../models/payment-reference.js";
import { qrConfigurationSchema, type QrConfiguration } from "../models/qr-configuration.js";
import { refundDetailSchema, type RefundDetail } from "../models/refund-detail.js";
import {
  refundPaymentReferenceSchema,
  type RefundPaymentReference,
} from "../models/refund-payment-reference.js";
import {
  unprocessableEntityErrorSchema,
  type UnprocessableEntityError,
} from "../models/unprocessable-entity-error.js";
import {
  v2InvoicingInvoicesCancel400Error1Schema,
  type V2InvoicingInvoicesCancel400Error1,
} from "../models/v2-invoicing-invoices-cancel400-error1.js";
import {
  v2InvoicingInvoicesCancel403Error1Schema,
  type V2InvoicingInvoicesCancel403Error1,
} from "../models/v2-invoicing-invoices-cancel403-error1.js";
import {
  v2InvoicingInvoicesCancel422Error1Schema,
  type V2InvoicingInvoicesCancel422Error1,
} from "../models/v2-invoicing-invoices-cancel422-error1.js";
import {
  v2InvoicingInvoicesPayments400Error1Schema,
  type V2InvoicingInvoicesPayments400Error1,
} from "../models/v2-invoicing-invoices-payments400-error1.js";
import {
  v2InvoicingInvoicesPayments403Error1Schema,
  type V2InvoicingInvoicesPayments403Error1,
} from "../models/v2-invoicing-invoices-payments403-error1.js";
import {
  v2InvoicingInvoicesPayments422Error1Schema,
  type V2InvoicingInvoicesPayments422Error1,
} from "../models/v2-invoicing-invoices-payments422-error1.js";
import {
  v2InvoicingInvoicesPayments422Error21Schema,
  type V2InvoicingInvoicesPayments422Error21,
} from "../models/v2-invoicing-invoices-payments422-error21.js";
import {
  v2InvoicingInvoicesRefunds400Error1Schema,
  type V2InvoicingInvoicesRefunds400Error1,
} from "../models/v2-invoicing-invoices-refunds400-error1.js";
import {
  v2InvoicingInvoicesRefunds403Error1Schema,
  type V2InvoicingInvoicesRefunds403Error1,
} from "../models/v2-invoicing-invoices-refunds403-error1.js";
import {
  v2InvoicingInvoicesRefunds422Error1Schema,
  type V2InvoicingInvoicesRefunds422Error1,
} from "../models/v2-invoicing-invoices-refunds422-error1.js";
import {
  v2InvoicingInvoicesRemind400Error1Schema,
  type V2InvoicingInvoicesRemind400Error1,
} from "../models/v2-invoicing-invoices-remind400-error1.js";
import {
  v2InvoicingInvoicesRemind403Error1Schema,
  type V2InvoicingInvoicesRemind403Error1,
} from "../models/v2-invoicing-invoices-remind403-error1.js";
import {
  v2InvoicingInvoicesRemind422Error1Schema,
  type V2InvoicingInvoicesRemind422Error1,
} from "../models/v2-invoicing-invoices-remind422-error1.js";
import {
  v2InvoicingInvoices400Error1Schema,
  type V2InvoicingInvoices400Error1,
} from "../models/v2-invoicing-invoices400-error1.js";
import {
  v2InvoicingInvoices400Error21Schema,
  type V2InvoicingInvoices400Error21,
} from "../models/v2-invoicing-invoices400-error21.js";
import {
  v2InvoicingInvoices403Error1Schema,
  type V2InvoicingInvoices403Error1,
} from "../models/v2-invoicing-invoices403-error1.js";
import {
  v2InvoicingInvoices422Error1Schema,
  type V2InvoicingInvoices422Error1,
} from "../models/v2-invoicing-invoices422-error1.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/invoices` resource to create, update, and send invoices and invoice reminders. To
 * manage invoices, you can also list invoices, show details for invoices, delete draft invoices,
 * and cancel sent invoices. You can also record payments for invoices to mark them as fully or
 * partially paid, or record refunds for invoices to mark them as fully or partially refunded. You
 * can create QR codes for invoices that can be scanned, viewed, and paid by a mobile phone.
 */
export class InvoicesApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Cancel sent invoice
   *
   * @remarks
   * Cancels a sent invoice, by ID, and, optionally, sends a notification about the cancellation to
   * the payer, merchant, and CC: emails.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link InvoicesApi.InvoicesCancelError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesCancel(
    request: InvoicesApi.InvoicesCancelRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesCancelError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/cancel"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: notificationSchema },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesCancelError,
      },
      options,
    );
  }

  /**
   * Create draft invoice
   *
   * @remarks
   * Creates a draft invoice. To move the invoice from a draft to payable state, you must <a
   * href="#invoices_send">send the invoice</a>.<br/><br/>In the JSON request body, include invoice
   * details including merchant information. The <code>invoice</code> object must include an
   * <code>items</code> array.<blockquote><strong>Note:</strong> The merchant that you specify in an
   * invoice must have a PayPal account in good standing.</blockquote>.
   *
   * @returns A successful request returns the HTTP `201 Created` status code. A JSON response body
   * that shows invoice details is returned if you set <code>prefer=return=representation</code>.
   *
   * @throws {@link InvoicesApi.InvoicesCreateError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesCreate(
    request: InvoicesApi.InvoicesCreateRequest,
    options?: RequestOptions,
  ): ApiPromise<Invoice, InvoicesApi.InvoicesCreateError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: invoiceSchema },
      },
      {
        success: { kind: "json", schema: invoiceSchema },
        errorFactory: InvoicesApi.InvoicesCreateError,
      },
      options,
    );
  }

  /**
   * Delete invoice
   *
   * @remarks
   * Deletes a draft or scheduled invoice, by ID. Deletes invoices in the draft or scheduled state
   * only. For invoices that have already been sent, you can <a
   * href="/docs/api/invoicing/v2/#invoices_cancel">cancel the invoice</a>. After you delete a draft
   * or scheduled invoice, you can no longer use it or show its details. However, you can reuse its
   * invoice number.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link InvoicesApi.InvoicesDeleteError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesDelete(
    request: InvoicesApi.InvoicesDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesDeleteError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesDeleteError,
      },
      options,
    );
  }

  /**
   * Generate QR code
   *
   * @remarks
   * Generates a QR code for an invoice, by ID. The QR code is a PNG image in <a
   * href="https://www.base64encode.org/">Base64-encoded</a> format that corresponds to the invoice
   * ID. You can generate a QR code for an invoice and add it to a paper or PDF invoice. When
   * customers use their mobile devices to scan the QR code, they are redirected to the PayPal
   * mobile payment flow where they can view the invoice and pay online with PayPal or a credit
   * card. Before you get a QR code, you must <a href="#invoices_create">create an invoice</a> and
   * <a href="#invoices_send">send an invoice</a> to move the invoice from a draft to payable state.
   * Do not include an email address if you do not want the invoice emailed.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows the QR code as a PNG image.
   *
   * @throws {@link InvoicesApi.InvoicesGenerateQrCodeError} when the API answers with an error
   * status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesGenerateQrCode(
    request: InvoicesApi.InvoicesGenerateQrCodeRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesGenerateQrCodeError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/generate-qr-code"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => qrConfigurationSchema)) },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesGenerateQrCodeError,
      },
      options,
    );
  }

  /**
   * Show invoice details
   *
   * @remarks
   * Shows details for an invoice, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows invoice details.
   *
   * @throws {@link InvoicesApi.InvoicesGetError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesGet(
    request: InvoicesApi.InvoicesGetRequest,
    options?: RequestOptions,
  ): ApiPromise<Invoice, InvoicesApi.InvoicesGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: invoiceSchema },
        errorFactory: InvoicesApi.InvoicesGetError,
      },
      options,
    );
  }

  /**
   * List invoices
   *
   * @remarks
   * Lists invoices. To filter the invoices that appear in the response, you can specify one or more
   * optional query parameters.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists invoices with details.
   *
   * @throws {@link InvoicesApi.InvoicesListError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesList(
    request: InvoicesApi.InvoicesListRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Invoices, InvoicesApi.InvoicesListError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [
          { name: "page", value: request.page, schema: s.defaulted(s.int(), 1) },
          { name: "page_size", value: request.pageSize, schema: s.defaulted(s.int(), 20) },
          { name: "total_required", value: request.totalRequired, schema: s.defaulted(s.boolean(), false) },
          { name: "fields", value: request.fields, schema: s.defaulted(s.string(), "all") },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: invoicesSchema },
        errorFactory: InvoicesApi.InvoicesListError,
      },
      options,
    );
  }

  /**
   * Record payment for invoice
   *
   * @remarks
   * Records a payment for the invoice. If no payment is due, the invoice is marked as `PAID`.
   * Otherwise, the invoice is marked as `PARTIALLY PAID`.
   *
   * @returns A successful request returns the HTTP `200 Created` status code and a reference to the
   * recorded payment.
   *
   * @throws {@link InvoicesApi.InvoicesPaymentsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesPayments(
    request: InvoicesApi.InvoicesPaymentsRequest,
    options?: RequestOptions,
  ): ApiPromise<PaymentReference, InvoicesApi.InvoicesPaymentsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/payments"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: paymentDetailSchema },
      },
      {
        success: { kind: "json", schema: paymentReferenceSchema },
        errorFactory: InvoicesApi.InvoicesPaymentsError,
      },
      options,
    );
  }

  /**
   * Delete external payment
   *
   * @remarks
   * Deletes an external payment, by invoice ID and transaction ID.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link InvoicesApi.InvoicesPaymentsDeleteError} when the API answers with an error
   * status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesPaymentsDelete(
    request: InvoicesApi.InvoicesPaymentsDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesPaymentsDeleteError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/payments/{transaction_id}"),
        auth: this.#auth.oauth2,
        pathParams: [
          { name: "invoice_id", value: request.invoiceId, schema: s.string() },
          { name: "transaction_id", value: request.transactionId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesPaymentsDeleteError,
      },
      options,
    );
  }

  /**
   * Record refund for invoice
   *
   * @remarks
   * Records a refund for the invoice. If all payments are refunded, the invoice is marked as
   * `REFUNDED`. Otherwise, the invoice is marked as `PARTIALLY REFUNDED`.
   *
   * @returns A successful request returns the HTTP `200 Created` status code and a reference to the
   * recorded refund.
   *
   * @throws {@link InvoicesApi.InvoicesRefundsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesRefunds(
    request: InvoicesApi.InvoicesRefundsRequest,
    options?: RequestOptions,
  ): ApiPromise<RefundPaymentReference, InvoicesApi.InvoicesRefundsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/refunds"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: refundDetailSchema },
      },
      {
        success: { kind: "json", schema: refundPaymentReferenceSchema },
        errorFactory: InvoicesApi.InvoicesRefundsError,
      },
      options,
    );
  }

  /**
   * Delete external refund
   *
   * @remarks
   * Deletes an external refund, by invoice ID and transaction ID.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link InvoicesApi.InvoicesRefundsDeleteError} when the API answers with an error
   * status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesRefundsDelete(
    request: InvoicesApi.InvoicesRefundsDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesRefundsDeleteError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/refunds/{transaction_id}"),
        auth: this.#auth.oauth2,
        pathParams: [
          { name: "invoice_id", value: request.invoiceId, schema: s.string() },
          { name: "transaction_id", value: request.transactionId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesRefundsDeleteError,
      },
      options,
    );
  }

  /**
   * Send invoice reminder
   *
   * @remarks
   * Sends a reminder to the payer about an invoice, by ID. In the JSON request body, include a
   * `notification` object that defines the subject of the reminder and other details.
   * <blockquote><strong>Notes:</strong><ul><li>API caller can send only 2 reminders in a
   * day.</li></ul></blockquote>.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link InvoicesApi.InvoicesRemindError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesRemind(
    request: InvoicesApi.InvoicesRemindRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, InvoicesApi.InvoicesRemindError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/remind"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => notificationSchema)) },
      },
      {
        success: { kind: "empty" },
        errorFactory: InvoicesApi.InvoicesRemindError,
      },
      options,
    );
  }

  /**
   * Send invoice
   *
   * @remarks
   * Sends or schedules an invoice, by ID, to be sent to a customer. The action depends on the
   * invoice issue date:<ul><li>If the invoice issue date is current or in the past, sends the
   * invoice immediately.</li><li>If the invoice issue date is in the future, schedules the invoice
   * to be sent on that date.</li></ul>To suppress the merchant's email notification, set the
   * `send_to_invoicer` body parameter to `false`. To send the invoice through a share link and not
   * through PayPal, set the <code>send_to_recipient</code> parameter to <code>false</code> in the
   * <code>notification</code> object. The <code>send_to_recipient</code> parameter does not apply
   * to a future issue date because the invoice is scheduled to be sent through PayPal on that
   * date.<blockquote><strong>Notes:</strong><ul><li>After you send an invoice, resending it has no
   * effect.</li><li>To send a notification for updates, <a href="#invoices_update">update the
   * invoice</a> and set the <code>send_to_recipient</code> body parameter to
   * <code>true</code>.</li></ul></blockquote>
   *
   * @returns A successful request returns the HTTP `200 OK` when the invoice issue date is current
   * date.
   *
   * @throws {@link InvoicesApi.InvoicesSendError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesSend(
    request: InvoicesApi.InvoicesSendRequest,
    options?: RequestOptions,
  ): ApiPromise<LinkDescription1, InvoicesApi.InvoicesSendError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}/send"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => notificationSchema)) },
      },
      {
        success: { kind: "json", schema: linkDescription1Schema },
        errorFactory: InvoicesApi.InvoicesSendError,
      },
      options,
    );
  }

  /**
   * Fully update invoice
   *
   * @remarks
   * Fully updates an invoice, by ID. In the JSON request body, include a complete `invoice` object.
   * This call does not support partial updates. <blockquote><strong>Notes:</strong><ul><li>API
   * caller can change/modify recipient only 2 times in 72 hours.</li></ul></blockquote>.
   *
   * @returns A successful request returns the HTTP `200 OK` status code. A JSON response body that
   * shows invoice details is returned if you set <code>prefer=return=representation</code>.
   *
   * @throws {@link InvoicesApi.InvoicesUpdateError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesUpdate(
    request: InvoicesApi.InvoicesUpdateRequest,
    options?: RequestOptions,
  ): ApiPromise<Invoice, InvoicesApi.InvoicesUpdateError> {
    return this.#rawClient.execute(
      {
        method: "PUT",
        urlTemplate: this.#servers.default("/v2/invoicing/invoices/{invoice_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "invoice_id", value: request.invoiceId, schema: s.string() }],
        query: [
          {
            name: "send_to_recipient",
            value: request.sendToRecipient,
            schema: s.defaulted(s.boolean(), true),
          },
          { name: "send_to_invoicer", value: request.sendToInvoicer, schema: s.defaulted(s.boolean(), true) },
        ],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: invoiceSchema },
      },
      {
        success: { kind: "json", schema: invoiceSchema },
        errorFactory: InvoicesApi.InvoicesUpdateError,
      },
      options,
    );
  }

  /**
   * Generate invoice number
   *
   * @remarks
   * Generates the next invoice number that is available to the merchant. The next invoice number
   * uses the prefix and suffix from the last invoice number and increments the number by one. For
   * example, the next invoice number after `INVOICE-1234` is `INVOICE-1235`.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows the next invoice number.
   *
   * @throws {@link InvoicesApi.InvoicingGenerateNextInvoiceNumberError} when the API answers with
   * an error status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicingGenerateNextInvoiceNumber(
    request: InvoicesApi.InvoicingGenerateNextInvoiceNumberRequest = {},
    options?: RequestOptions,
  ): ApiPromise<InvoiceNumber, InvoicesApi.InvoicingGenerateNextInvoiceNumberError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/generate-next-invoice-number"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => fetchTypeSchema)) },
      },
      {
        success: { kind: "json", schema: invoiceNumberSchema },
        errorFactory: InvoicesApi.InvoicingGenerateNextInvoiceNumberError,
      },
      options,
    );
  }
}

export namespace InvoicesApi {
  export type InvoicesCancelRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The email or SMS notification that will be sent to the payer on cancellation. */
    body: Notification;
  };

  export class InvoicesCancelError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoicesCancel400Error1", V2InvoicingInvoicesCancel400Error1>
      | Declared<"v2InvoicingInvoicesCancel403Error1", V2InvoicingInvoicesCancel403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoicesCancel422Error1", V2InvoicingInvoicesCancel422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesCancelError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoicesCancel400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesCancel400Error1Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingInvoicesCancel403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesCancel403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoicesCancel422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesCancel422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesCreateRequest = {
    /**
     * The invoice details which includes all information of the invoice like items, billing
     * information.
     */
    body: Invoice;
  };

  export class InvoicesCreateError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoices400Error1", V2InvoicingInvoices400Error1>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"v2InvoicingInvoices422Error1", V2InvoicingInvoices422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesCreateError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoices400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices400Error1Schema },
      },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoices422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesDeleteRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
  };

  export class InvoicesDeleteError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"v2InvoicingInvoices403Error1", V2InvoicingInvoices403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesDeleteError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      {
        on: 403,
        kind: "v2InvoicingInvoices403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesGenerateQrCodeRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** Optional configuration parameters to adjust QR code width, height and the encoded URL. */
    body?: QrConfiguration;
  };

  export class InvoicesGenerateQrCodeError extends ApiError {
    declare readonly payload:
      | Declared<"error400", undefined>
      | Declared<"error403", undefined>
      | Declared<"error404", undefined>
      | Declared<"error500", undefined>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesGenerateQrCodeError> = [
      { on: 400, kind: "error400", decode: { kind: "empty" } },
      { on: 403, kind: "error403", decode: { kind: "empty" } },
      { on: 404, kind: "error404", decode: { kind: "empty" } },
      { on: 500, kind: "error500", decode: { kind: "empty" } },
    ];
  }

  export type InvoicesGetRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
  };

  export class InvoicesGetError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"v2InvoicingInvoices403Error1", V2InvoicingInvoices403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesGetError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      {
        on: 403,
        kind: "v2InvoicingInvoices403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesListRequest = {
    /**
     * The page number to be retrieved, for the list of templates. So, a combination of `page=1` and
     * `page_size=20` returns the first 20 templates. A combination of `page=2` and `page_size=20`
     * returns the next 20 templates.
     *
     * @default 1
     */
    page?: number;
    /** The maximum number of templates to return in the response. @default 20 */
    pageSize?: number;
    /**
     * Indicates whether the to show <code>total_pages</code> and <code>total_items</code> in the
     * response.
     *
     * @default false
     */
    totalRequired?: boolean;
    /**
     * The fields to return in the response. Value is `all` or `none`. To return only the template
     * name, ID, and default attributes, specify `none`.
     *
     * @default "all"
     */
    fields?: string;
  };

  export class InvoicesListError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoices400Error21", V2InvoicingInvoices400Error21>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesListError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoices400Error21",
        decode: { kind: "json", schema: v2InvoicingInvoices400Error21Schema },
      },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesPaymentsRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The details of the payment to record against the invoice. */
    body: PaymentDetail;
  };

  export class InvoicesPaymentsError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoicesPayments400Error1", V2InvoicingInvoicesPayments400Error1>
      | Declared<"v2InvoicingInvoicesPayments403Error1", V2InvoicingInvoicesPayments403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoicesPayments422Error1", V2InvoicingInvoicesPayments422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesPaymentsError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoicesPayments400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesPayments400Error1Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingInvoicesPayments403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesPayments403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoicesPayments422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesPayments422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesPaymentsDeleteRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The ID of the external refund transaction to delete. */
    transactionId: string;
  };

  export class InvoicesPaymentsDeleteError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"v2InvoicingInvoicesPayments403Error1", V2InvoicingInvoicesPayments403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoicesPayments422Error21", V2InvoicingInvoicesPayments422Error21>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesPaymentsDeleteError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      {
        on: 403,
        kind: "v2InvoicingInvoicesPayments403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesPayments403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoicesPayments422Error21",
        decode: { kind: "json", schema: v2InvoicingInvoicesPayments422Error21Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesRefundsRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The details of the refund to record against the invoice. */
    body: RefundDetail;
  };

  export class InvoicesRefundsError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoicesRefunds400Error1", V2InvoicingInvoicesRefunds400Error1>
      | Declared<"v2InvoicingInvoicesRefunds403Error1", V2InvoicingInvoicesRefunds403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoicesRefunds422Error1", V2InvoicingInvoicesRefunds422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesRefundsError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoicesRefunds400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRefunds400Error1Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingInvoicesRefunds403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRefunds403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoicesRefunds422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRefunds422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesRefundsDeleteRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The ID of the external refund transaction to delete. */
    transactionId: string;
  };

  export class InvoicesRefundsDeleteError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"v2InvoicingInvoicesRefunds403Error1", V2InvoicingInvoicesRefunds403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesRefundsDeleteError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      {
        on: 403,
        kind: "v2InvoicingInvoicesRefunds403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRefunds403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesRemindRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The email or SMS notification that will be sent to the payer for reminder. */
    body?: Notification;
  };

  export class InvoicesRemindError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoicesRemind400Error1", V2InvoicingInvoicesRemind400Error1>
      | Declared<"v2InvoicingInvoicesRemind403Error1", V2InvoicingInvoicesRemind403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoicesRemind422Error1", V2InvoicingInvoicesRemind422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesRemindError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoicesRemind400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRemind400Error1Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingInvoicesRemind403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRemind403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoicesRemind422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoicesRemind422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesSendRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** The email or SMS notification to send to the payer when they send an invoice.. */
    body?: Notification;
  };

  export class InvoicesSendError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"unprocessableEntityError", UnprocessableEntityError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesSendError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "unprocessableEntityError",
        decode: { kind: "json", schema: unprocessableEntityErrorSchema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicesUpdateRequest = {
    /** The ID of the draft invoice to delete. */
    invoiceId: string;
    /** Indicates whether to send the invoice update notification to the recipient. @default true */
    sendToRecipient?: boolean;
    /** Indicates whether to send the invoice update notification to the merchant. @default true */
    sendToInvoicer?: boolean;
    /** A representation of changes to make in the invoice. */
    body: Invoice;
  };

  export class InvoicesUpdateError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingInvoices400Error1", V2InvoicingInvoices400Error1>
      | Declared<"v2InvoicingInvoices403Error1", V2InvoicingInvoices403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"v2InvoicingInvoices422Error1", V2InvoicingInvoices422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesUpdateError> = [
      {
        on: 400,
        kind: "v2InvoicingInvoices400Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices400Error1Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingInvoices403Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingInvoices422Error1",
        decode: { kind: "json", schema: v2InvoicingInvoices422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type InvoicingGenerateNextInvoiceNumberRequest = {
    /** Is the fetch type invoice number or id. */
    body?: FetchType;
  };

  export class InvoicingGenerateNextInvoiceNumberError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicingGenerateNextInvoiceNumberError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }
}
