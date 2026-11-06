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
  apiVaultsSavingsNextRequestSchema,
  type ApiVaultsSavingsNextRequest,
} from "../models/api-vaults-savings-next-request.js";
import { errorSchema, type Error } from "../models/error.js";
import type { Servers } from "../servers.js";

/**
 * Vaults paid into over time
 */
export class SavingsApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Take the next savings payment now (from the owner's saved PayPal)
   *
   * @remarks
   * Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).
   *
   * @returns OK
   *
   * @throws {@link SavingsApi.ChargeSavingsNowError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  chargeSavingsNow(
    request: SavingsApi.ChargeSavingsNowRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, SavingsApi.ChargeSavingsNowError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/savings/charge"),
        auth: this.#auth.internalKey,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: SavingsApi.ChargeSavingsNowError,
      },
      options,
    );
  }

  /**
   * Move the next savings payment (the later ones follow)
   *
   * @returns OK
   *
   * @throws {@link SavingsApi.MoveSavingsPaymentError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  moveSavingsPayment(
    request: SavingsApi.MoveSavingsPaymentRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, SavingsApi.MoveSavingsPaymentError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/savings/next"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsSavingsNextRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: SavingsApi.MoveSavingsPaymentError,
      },
      options,
    );
  }

  /**
   * Pause the savings plan
   *
   * @returns OK
   *
   * @throws {@link SavingsApi.PauseSavingsError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  pauseSavings(
    request: SavingsApi.PauseSavingsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, SavingsApi.PauseSavingsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/savings/pause"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: SavingsApi.PauseSavingsError,
      },
      options,
    );
  }

  /**
   * Resume the savings plan
   *
   * @returns OK
   *
   * @throws {@link SavingsApi.ResumeSavingsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  resumeSavings(
    request: SavingsApi.ResumeSavingsRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, SavingsApi.ResumeSavingsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/savings/resume"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: SavingsApi.ResumeSavingsError,
      },
      options,
    );
  }
}

export namespace SavingsApi {
  export type ChargeSavingsNowRequest = {
    /** Vault id */
    id: string;
  };

  export class ChargeSavingsNowError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ChargeSavingsNowError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type MoveSavingsPaymentRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsSavingsNextRequest;
  };

  export class MoveSavingsPaymentError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<MoveSavingsPaymentError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type PauseSavingsRequest = {
    /** Vault id */
    id: string;
  };

  export class PauseSavingsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<PauseSavingsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ResumeSavingsRequest = {
    /** Vault id */
    id: string;
  };

  export class ResumeSavingsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ResumeSavingsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
