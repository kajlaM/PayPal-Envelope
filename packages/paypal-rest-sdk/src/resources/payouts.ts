import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { createPayoutRequestSchema, type CreatePayoutRequest } from "../models/create-payout-request.js";
import { createPayoutResponseSchema, type CreatePayoutResponse } from "../models/create-payout-response.js";
import { errorSchema, type Error } from "../models/error.js";
import { payoutBatchSchema, type PayoutBatch } from "../models/payout-batch.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/payouts` resource to create a batch payout, update the status for a batch payout, show
 * the status of a batch payout with the transaction status and other data for individual payout
 * items, and request approval for a batch payout.
 */
export class Payouts {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Show payout batch details
   *
   * @remarks
   * Shows the latest status of a batch payout. Includes the transaction status and other data for
   * individual payout items.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows batch payout details.
   *
   * @throws {@link Payouts.PayoutsGetError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  payoutsGet(
    request: Payouts.PayoutsGetRequest,
    options?: RequestOptions,
  ): ApiPromise<PayoutBatch, Payouts.PayoutsGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/payments/payouts/{id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [
          { name: "fields", value: request.fields, schema: s.optional(s.string()) },
          { name: "page", value: request.page, schema: s.defaulted(s.int(), 1) },
          { name: "page_size", value: request.pageSize, schema: s.optional(s.int()) },
          { name: "total_required", value: request.totalRequired, schema: s.defaulted(s.boolean(), false) },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: payoutBatchSchema },
        errorFactory: Payouts.PayoutsGetError,
      },
      options,
    );
  }

  /**
   * Create batch payout
   *
   * @remarks
   * Creates a batch payout. In the JSON request body, pass a `sender_batch_header` and an `items`
   * array. The `sender_batch_header` defines how to handle the payout. The `items` array defines
   * the payout items.<br/>You can make payouts to one or more
   * recipients.<blockquote><strong>Notes:</strong> <ul><li><p>PayPal does not process duplicate
   * payouts. If you specify a <code>sender_batch_id</code> that was used in the last 30 days, the
   * API rejects the request with an error message that shows the duplicate
   * <code>sender_batch_id</code> and includes a HATEOAS link to the original payout with the same
   * <code>sender_batch_id</code>.</p><p>If you receive an HTTP <code>5<i>nn</i></code> status code,
   * you can safely retry the request with the same <code>sender_batch_id</code>.</p></li><li><p>The
   * Payouts API does not support build notation (BN) codes. In a future Payouts release, you can
   * optionally provide BN codes in the <code>PayPal-Partner-Attribution-Id</code> request
   * header.</p><p>For information about the <code>PayPal-Partner-Attribution-Id</code> header, see
   * <a href="/api/rest/requests/#http-request-headers">HTTP request headers</a>. To learn about or
   * request a BN code, contact your partner manager or see <a
   * href="https://www.paypal.com/us/webapps/mpp/partner-program">PayPal Partner
   * Program</a>.</p></li></ul></blockquote>
   *
   * @returns A successful request returns the HTTP <code>201 Created</code> status code and a JSON
   * response body that shows the ID for the payout and payout details. To show payout status, use
   * the <code>payout_batch_id</code> value that appears in the response. If the initial scan that
   * checks for syntax errors, missing or duplicated keywords, and more succeeds, the
   * <code>batch_status</code> is <code>PENDING</code>. The initial scan checks for syntax errors
   * and missing or duplicated keywords. The API does not immediately validate some payout item
   * values, such as the receiver phone numbers.
   *
   * @throws {@link Payouts.PayoutsPostError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  payoutsPost(
    request: Payouts.PayoutsPostRequest = {},
    options?: RequestOptions,
  ): ApiPromise<CreatePayoutResponse, Payouts.PayoutsPostError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/payments/payouts"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [
          { name: "PayPal-Request-Id", value: request.payPalRequestId, schema: s.optional(s.string()) },
          { name: "Idempotency-Key", value: uuid(), schema: s.string() },
        ],
        body: {
          kind: "json",
          value: request.body,
          schema: s.optional(s.lazy(() => createPayoutRequestSchema)),
        },
      },
      {
        success: { kind: "json", schema: createPayoutResponseSchema },
        errorFactory: Payouts.PayoutsPostError,
      },
      options,
    );
  }
}

export namespace Payouts {
  export type PayoutsGetRequest = {
    /** The ID of the payout for which to show details. */
    id: string;
    /** Shows details for only the specified fields. */
    fields?: string;
    /** A non-zero integer representing the page of the results. @default 1 */
    page?: number;
    /**
     * The maximum number of results to return at one time. Value is a non-negative, non-zero
     * integer. If the user chooses pagination, the maximum page is `1000`.
     */
    pageSize?: number;
    /**
     * Indicates whether to show the total items and total pages count in the response.
     *
     * @default false
     */
    totalRequired?: boolean;
  };

  export class PayoutsGetError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;

    static readonly errors: ErrorDecoders<PayoutsGetError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 500, kind: "error2", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type PayoutsPostRequest = {
    /** The server stores keys for 30 days. */
    payPalRequestId?: string;
    body?: CreatePayoutRequest;
  };

  export class PayoutsPostError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<PayoutsPostError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 403, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 500, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
