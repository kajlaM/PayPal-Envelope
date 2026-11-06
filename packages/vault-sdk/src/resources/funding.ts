import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import {
  apiVaultsFundCaptureRequestSchema,
  type ApiVaultsFundCaptureRequest,
} from "../models/api-vaults-fund-capture-request.js";
import {
  apiVaultsFundRecordedRequestSchema,
  type ApiVaultsFundRecordedRequest,
} from "../models/api-vaults-fund-recorded-request.js";
import {
  apiVaultsFundRequestsRequestSchema,
  type ApiVaultsFundRequestsRequest,
} from "../models/api-vaults-fund-requests-request.js";
import {
  apiVaultsSubscribeConfirmRequestSchema,
  type ApiVaultsSubscribeConfirmRequest,
} from "../models/api-vaults-subscribe-confirm-request.js";
import { errorSchema, type Error } from "../models/error.js";
import { status3Schema, type Status3 } from "../models/status3.js";
import type { Servers } from "../servers.js";

/**
 * Money into a vault, always from PayPal
 */
export class Funding {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Cancel an open money request
   *
   * @returns OK
   *
   * @throws {@link Funding.CancelFundRequestError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  cancelFundRequest(
    request: Funding.CancelFundRequestRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.CancelFundRequestError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/requests/{requestId}/cancel"),
        auth: noneAuth,
        pathParams: [
          { name: "id", value: request.id, schema: s.string() },
          { name: "requestId", value: request.requestId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.CancelFundRequestError,
      },
      options,
    );
  }

  /**
   * Capture the approved order: the vault gets its money
   *
   * @returns OK
   *
   * @throws {@link Funding.CaptureFundingError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  captureFunding(
    request: Funding.CaptureFundingRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.CaptureFundingError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/capture"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsFundCaptureRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.CaptureFundingError,
      },
      options,
    );
  }

  /**
   * Confirm the approved subscription
   *
   * @returns OK
   *
   * @throws {@link Funding.ConfirmSubscriptionError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  confirmSubscription(
    request: Funding.ConfirmSubscriptionRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.ConfirmSubscriptionError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/subscribe/confirm"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsSubscribeConfirmRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.ConfirmSubscriptionError,
      },
      options,
    );
  }

  /**
   * Ask a friend: a PayPal money request whose payment funds the vault
   *
   * @returns OK
   *
   * @throws {@link Funding.CreateFundRequestError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  createFundRequest(
    request: Funding.CreateFundRequestRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.CreateFundRequestError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/requests"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsFundRequestsRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.CreateFundRequestError,
      },
      options,
    );
  }

  /**
   * PayPal order for the PayPal button (the owner approves it on PayPal)
   *
   * @returns OK
   *
   * @throws {@link Funding.CreateFundingOrderError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  createFundingOrder(
    request: Funding.CreateFundingOrderRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.CreateFundingOrderError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/order"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.CreateFundingOrderError,
      },
      options,
    );
  }

  /**
   * Utility vault: monthly PayPal subscription that tops it up
   *
   * @returns OK
   *
   * @throws {@link Funding.CreateSubscriptionError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  createSubscription(
    request: Funding.CreateSubscriptionRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.CreateSubscriptionError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/subscribe"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.CreateSubscriptionError,
      },
      options,
    );
  }

  /**
   * Money requests sent to one PayPal email
   *
   * @returns OK
   *
   * @throws {@link Funding.ListFundRequestsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listFundRequests(
    request: Funding.ListFundRequestsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>[], Funding.ListFundRequestsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/fund-requests"),
        auth: noneAuth,
        pathParams: [],
        query: [
          { name: "payerEmail", value: request.payerEmail, schema: s.string() },
          { name: "status", value: request.status, schema: s.optional(s.lazy(() => status3Schema)) },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.record(s.string(), s.unknown())) },
        errorFactory: Funding.ListFundRequestsError,
      },
      options,
    );
  }

  /**
   * Record a payment the site took from the owner's saved PayPal
   *
   * @remarks
   * Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).
   *
   * @returns OK
   *
   * @throws {@link Funding.RecordFundingError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  recordFunding(
    request: Funding.RecordFundingRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.RecordFundingError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/recorded"),
        auth: this.#auth.internalKey,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsFundRecordedRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.RecordFundingError,
      },
      options,
    );
  }

  /**
   * Ask PayPal about one money request
   *
   * @returns OK
   *
   * @throws {@link Funding.SyncFundRequestError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  syncFundRequest(
    request: Funding.SyncFundRequestRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.SyncFundRequestError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/fund-requests/{id}/sync"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.SyncFundRequestError,
      },
      options,
    );
  }

  /**
   * Ask PayPal whether the friend paid
   *
   * @returns OK
   *
   * @throws {@link Funding.SyncFundRequestsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  syncFundRequests(
    request: Funding.SyncFundRequestsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Funding.SyncFundRequestsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/fund/requests/sync"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Funding.SyncFundRequestsError,
      },
      options,
    );
  }
}

export namespace Funding {
  export type CancelFundRequestRequest = {
    /** Vault id */
    id: string;
    requestId: string;
  };

  export class CancelFundRequestError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CancelFundRequestError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CaptureFundingRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsFundCaptureRequest;
  };

  export class CaptureFundingError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CaptureFundingError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ConfirmSubscriptionRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsSubscribeConfirmRequest;
  };

  export class ConfirmSubscriptionError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ConfirmSubscriptionError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CreateFundRequestRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsFundRequestsRequest;
  };

  export class CreateFundRequestError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CreateFundRequestError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CreateFundingOrderRequest = {
    /** Vault id */
    id: string;
  };

  export class CreateFundingOrderError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CreateFundingOrderError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CreateSubscriptionRequest = {
    /** Vault id */
    id: string;
  };

  export class CreateSubscriptionError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CreateSubscriptionError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ListFundRequestsRequest = {
    payerEmail: string;
    status?: Status3;
  };

  export class ListFundRequestsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListFundRequestsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type RecordFundingRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsFundRecordedRequest;
  };

  export class RecordFundingError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RecordFundingError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type SyncFundRequestRequest = {
    /** Vault id */
    id: string;
  };

  export class SyncFundRequestError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<SyncFundRequestError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type SyncFundRequestsRequest = {
    /** Vault id */
    id: string;
  };

  export class SyncFundRequestsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<SyncFundRequestsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
