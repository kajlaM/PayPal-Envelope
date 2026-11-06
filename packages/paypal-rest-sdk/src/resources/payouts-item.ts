import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema, type Error } from "../models/error.js";
import { payoutItem2Schema, type PayoutItem2 } from "../models/payout-item2.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/payouts-item` resource to show payout item details and cancel an unclaimed payout item.
 */
export class PayoutsItem {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Cancel unclaimed payout item
   *
   * @remarks
   * Cancels an unclaimed payout item, by ID. If no one claims the unclaimed item within 30 days,
   * the API automatically returns the funds to the sender. Use this call to cancel the unclaimed
   * item before the automatic 30-day refund. You can cancel payout items with a
   * <code>transaction_status</code> of <code>UNCLAIMED</code>.
   *
   * @returns A successful request returns the HTTP `200 OK` status code with a JSON response body
   * that shows payout item details.
   *
   * @throws {@link PayoutsItem.PayoutsItemCancelError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  payoutsItemCancel(
    request: PayoutsItem.PayoutsItemCancelRequest,
    options?: RequestOptions,
  ): ApiPromise<PayoutItem2, PayoutsItem.PayoutsItemCancelError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/payments/payouts-item/{payout_item_id}/cancel"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "payout_item_id", value: request.payoutItemId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: payoutItem2Schema },
        errorFactory: PayoutsItem.PayoutsItemCancelError,
      },
      options,
    );
  }

  /**
   * Show payout item details
   *
   * @remarks
   * Shows details for a payout item, by ID. A <code>payout_item_id</code> helps you identify denied
   * payments. If a payment is denied, you can use the <code>payout_item_id</code> to identify the
   * payment even if it lacks a <code>transaction_id</code>.
   *
   * @returns A successful request returns the HTTP <code>200 OK</code> status code and a JSON
   * response body with a <code>payout_item_details</code> object, which contains data about a
   * payout item including the transaction status.
   *
   * @throws {@link PayoutsItem.PayoutsItemGetError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  payoutsItemGet(
    request: PayoutsItem.PayoutsItemGetRequest,
    options?: RequestOptions,
  ): ApiPromise<PayoutItem2, PayoutsItem.PayoutsItemGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/payments/payouts-item/{payout_item_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "payout_item_id", value: request.payoutItemId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: payoutItem2Schema },
        errorFactory: PayoutsItem.PayoutsItemGetError,
      },
      options,
    );
  }
}

export namespace PayoutsItem {
  export type PayoutsItemCancelRequest = {
    /** The ID of the payout item to cancel. */
    payoutItemId: string;
  };

  export class PayoutsItemCancelError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<PayoutsItemCancelError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 500, kind: "error3", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type PayoutsItemGetRequest = {
    /** The ID of the payout item to cancel. */
    payoutItemId: string;
  };

  export class PayoutsItemGetError extends ApiError {
    declare readonly payload: Declared<"error", Error> | Declared<"error2", Error> | Undeclared;

    static readonly errors: ErrorDecoders<PayoutsItemGetError> = [
      { on: 404, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 500, kind: "error2", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
