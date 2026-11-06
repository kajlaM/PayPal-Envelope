import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { decisionSchema, type Decision } from "../models/decision.js";
import { errorSchema, type Error } from "../models/error.js";
import { ledgerEntrySchema, type LedgerEntry } from "../models/ledger-entry.js";
import type { Servers } from "../servers.js";

/**
 * Health, merchants, background jobs
 */
export class System {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Is the API up?
   *
   * @returns OK
   *
   * @throws {@link System.HealthError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  health(options?: RequestOptions): ApiPromise<Record<string, unknown>, System.HealthError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/health"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: System.HealthError,
      },
      options,
    );
  }

  /**
   * Latest Policy Engine decisions (optionally of one vault)
   *
   * @returns OK
   *
   * @throws {@link System.ListDecisionsError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listDecisions(
    request: System.ListDecisionsRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Decision[], System.ListDecisionsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/decisions"),
        auth: noneAuth,
        pathParams: [],
        query: [{ name: "vaultId", value: request.vaultId, schema: s.optional(s.string()) }],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => decisionSchema)) },
        errorFactory: System.ListDecisionsError,
      },
      options,
    );
  }

  /**
   * Latest ledger entries (optionally of one vault)
   *
   * @returns OK
   *
   * @throws {@link System.ListLedgerError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listLedger(
    request: System.ListLedgerRequest = {},
    options?: RequestOptions,
  ): ApiPromise<LedgerEntry[], System.ListLedgerError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/ledger"),
        auth: noneAuth,
        pathParams: [],
        query: [{ name: "vaultId", value: request.vaultId, schema: s.optional(s.string()) }],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => ledgerEntrySchema)) },
        errorFactory: System.ListLedgerError,
      },
      options,
    );
  }

  /**
   * Shops vaults may pay
   *
   * @returns OK
   *
   * @throws {@link System.ListMerchantsError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listMerchants(options?: RequestOptions): ApiPromise<Record<string, unknown>[], System.ListMerchantsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/merchants"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.record(s.string(), s.unknown())) },
        errorFactory: System.ListMerchantsError,
      },
      options,
    );
  }

  /**
   * Run the background jobs once (sweeper, savings, watch mode, nightly PayPal check)
   *
   * @remarks
   * Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).
   *
   * @returns OK
   *
   * @throws {@link System.RunBackgroundJobsError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  runBackgroundJobs(
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, System.RunBackgroundJobsError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/jobs/tick"),
        auth: this.#auth.internalKey,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: System.RunBackgroundJobsError,
      },
      options,
    );
  }
}

export namespace System {
  export class HealthError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<HealthError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ListDecisionsRequest = {
    vaultId?: string;
  };

  export class ListDecisionsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListDecisionsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ListLedgerRequest = {
    vaultId?: string;
  };

  export class ListLedgerError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListLedgerError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export class ListMerchantsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListMerchantsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export class RunBackgroundJobsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RunBackgroundJobsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
