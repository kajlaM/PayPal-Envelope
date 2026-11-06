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
  apiVaultsProposalsChooseRequestSchema,
  type ApiVaultsProposalsChooseRequest,
} from "../models/api-vaults-proposals-choose-request.js";
import {
  apiVaultsProposalsRequestSchema,
  type ApiVaultsProposalsRequest,
} from "../models/api-vaults-proposals-request.js";
import {
  apiVaultsSpendRequestSchema,
  type ApiVaultsSpendRequest,
} from "../models/api-vaults-spend-request.js";
import { errorSchema, type Error } from "../models/error.js";
import { spendResultSchema, type SpendResult } from "../models/spend-result.js";
import type { Servers } from "../servers.js";

/**
 * Every payment out goes through the Policy Engine
 */
export class Purchases {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * The owner approves a waiting purchase (the hard rules are checked again first)
   *
   * @remarks
   * The site asks for the owner's password before calling this.
   *
   * @returns OK
   *
   * @throws {@link Purchases.ApprovePurchaseError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  approvePurchase(
    request: Purchases.ApprovePurchaseRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Purchases.ApprovePurchaseError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/decisions/{decisionId}/approve"),
        auth: noneAuth,
        pathParams: [
          { name: "id", value: request.id, schema: s.string() },
          { name: "decisionId", value: request.decisionId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Purchases.ApprovePurchaseError,
      },
      options,
    );
  }

  /**
   * The owner picks an option (it then goes through the Policy Engine)
   *
   * @returns OK
   *
   * @throws {@link Purchases.ChooseOptionError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  chooseOption(
    request: Purchases.ChooseOptionRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Purchases.ChooseOptionError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/proposals/{proposalId}/choose"),
        auth: noneAuth,
        pathParams: [
          { name: "id", value: request.id, schema: s.string() },
          { name: "proposalId", value: request.proposalId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsProposalsChooseRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Purchases.ChooseOptionError,
      },
      options,
    );
  }

  /**
   * The agent suggests up to 3 options; nothing is bought until the owner picks one
   *
   * @remarks
   * Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).
   *
   * @returns Created
   *
   * @throws {@link Purchases.ProposeOptionsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  proposeOptions(
    request: Purchases.ProposeOptionsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Purchases.ProposeOptionsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/proposals"),
        auth: this.#auth.internalKey,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsProposalsRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Purchases.ProposeOptionsError,
      },
      options,
    );
  }

  /**
   * The owner wants none of the options
   *
   * @returns OK
   *
   * @throws {@link Purchases.RejectOptionsError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  rejectOptions(
    request: Purchases.RejectOptionsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Purchases.RejectOptionsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/proposals/{proposalId}/reject"),
        auth: noneAuth,
        pathParams: [
          { name: "id", value: request.id, schema: s.string() },
          { name: "proposalId", value: request.proposalId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Purchases.RejectOptionsError,
      },
      options,
    );
  }

  /**
   * The owner rejects a waiting purchase
   *
   * @returns OK
   *
   * @throws {@link Purchases.RejectPurchaseError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  rejectPurchase(
    request: Purchases.RejectPurchaseRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Purchases.RejectPurchaseError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/decisions/{decisionId}/reject"),
        auth: noneAuth,
        pathParams: [
          { name: "id", value: request.id, schema: s.string() },
          { name: "decisionId", value: request.decisionId, schema: s.string() },
        ],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Purchases.RejectPurchaseError,
      },
      options,
    );
  }

  /**
   * The agent ASKS to buy: the Policy Engine approves, blocks, or asks the owner
   *
   * @remarks
   * The only way money leaves a vault for a shop. The Policy Engine checks the vault rules (budget,
   * shops, categories, limits, live price) first. 200 = approved and paid with PayPal; 202 = waits
   * for the owner's approval; 403 = blocked. Internal: needs the internal key (only PayPalVault's
   * own site, agent and jobs have it).
   *
   * @returns Approved and paid
   *
   * @throws {@link Purchases.RequestPurchaseError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  requestPurchase(
    request: Purchases.RequestPurchaseRequest,
    options?: RequestOptions,
  ): ApiPromise<SpendResult, Purchases.RequestPurchaseError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/spend"),
        auth: this.#auth.internalKey,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsSpendRequestSchema },
      },
      {
        success: { kind: "json", schema: spendResultSchema },
        errorFactory: Purchases.RequestPurchaseError,
      },
      options,
    );
  }
}

export namespace Purchases {
  export type ApprovePurchaseRequest = {
    /** Vault id */
    id: string;
    decisionId: string;
  };

  export class ApprovePurchaseError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ApprovePurchaseError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ChooseOptionRequest = {
    /** Vault id */
    id: string;
    proposalId: string;
    body: ApiVaultsProposalsChooseRequest;
  };

  export class ChooseOptionError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ChooseOptionError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ProposeOptionsRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsProposalsRequest;
  };

  export class ProposeOptionsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ProposeOptionsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type RejectOptionsRequest = {
    /** Vault id */
    id: string;
    proposalId: string;
  };

  export class RejectOptionsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RejectOptionsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type RejectPurchaseRequest = {
    /** Vault id */
    id: string;
    decisionId: string;
  };

  export class RejectPurchaseError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RejectPurchaseError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type RequestPurchaseRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsSpendRequest;
  };

  export class RequestPurchaseError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"spendResult", SpendResult>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RequestPurchaseError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 403, kind: "spendResult", decode: { kind: "json", schema: spendResultSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
