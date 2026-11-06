import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import {
  apiVaultsCompileRequestSchema,
  type ApiVaultsCompileRequest,
} from "../models/api-vaults-compile-request.js";
import {
  apiVaultsExpiryRequestSchema,
  type ApiVaultsExpiryRequest,
} from "../models/api-vaults-expiry-request.js";
import {
  apiVaultsPolicyRequestSchema,
  type ApiVaultsPolicyRequest,
} from "../models/api-vaults-policy-request.js";
import { apiVaultsRequestSchema, type ApiVaultsRequest } from "../models/api-vaults-request.js";
import { errorSchema, type Error } from "../models/error.js";
import { vaultDetailsSchema, type VaultDetails } from "../models/vault-details.js";
import { vaultSummarySchema, type VaultSummary } from "../models/vault-summary.js";
import type { Servers } from "../servers.js";

/**
 * Create, read, change and close vaults
 */
export class Vaults {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;

  constructor(rawClient: RawClient, servers: Servers) {
    this.#rawClient = rawClient;
    this.#servers = servers;
  }

  /**
   * Move the vault's end date
   *
   * @returns OK
   *
   * @throws {@link Vaults.ChangeExpiryError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  changeExpiry(
    request: Vaults.ChangeExpiryRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.ChangeExpiryError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/expiry"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsExpiryRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.ChangeExpiryError,
      },
      options,
    );
  }

  /**
   * Change an active vault's rules or amount (a new version; lower amount refunds the difference)
   *
   * @returns OK
   *
   * @throws {@link Vaults.ChangePolicyError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  changePolicy(
    request: Vaults.ChangePolicyRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.ChangePolicyError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/policy"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsPolicyRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.ChangePolicyError,
      },
      options,
    );
  }

  /**
   * Plain English to vault rules (preview only; nothing is saved)
   *
   * @returns OK
   *
   * @throws {@link Vaults.CompilePolicyError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  compilePolicy(
    request: Vaults.CompilePolicyRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.CompilePolicyError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/compile"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsCompileRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.CompilePolicyError,
      },
      options,
    );
  }

  /**
   * Create a vault from reviewed rules (it waits for its money)
   *
   * @returns Created
   *
   * @throws {@link Vaults.CreateVaultError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  createVault(
    request: Vaults.CreateVaultRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.CreateVaultError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.CreateVaultError,
      },
      options,
    );
  }

  /**
   * One vault with its ledger, decisions, rule history, proposals and savings plan
   *
   * @returns OK
   *
   * @throws {@link Vaults.GetVaultError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  getVault(
    request: Vaults.GetVaultRequest,
    options?: RequestOptions,
  ): ApiPromise<VaultDetails, Vaults.GetVaultError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/vaults/{id}"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: vaultDetailsSchema },
        errorFactory: Vaults.GetVaultError,
      },
      options,
    );
  }

  /**
   * Close the vault and refund what is left to the owner's PayPal (Payouts)
   *
   * @returns OK
   *
   * @throws {@link Vaults.LiquidateVaultError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  liquidateVault(
    request: Vaults.LiquidateVaultRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.LiquidateVaultError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/liquidate"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.LiquidateVaultError,
      },
      options,
    );
  }

  /**
   * Every vault of one customer with full details
   *
   * @returns OK
   *
   * @throws {@link Vaults.ListVaultDetailsError} when the API answers with an error status — narrow
   * on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listVaultDetails(
    request: Vaults.ListVaultDetailsRequest,
    options?: RequestOptions,
  ): ApiPromise<VaultDetails[], Vaults.ListVaultDetailsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/vaults/details"),
        auth: noneAuth,
        pathParams: [],
        query: [{ name: "userId", value: request.userId, schema: s.string() }],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => vaultDetailsSchema)) },
        errorFactory: Vaults.ListVaultDetailsError,
      },
      options,
    );
  }

  /**
   * All vaults with totals, Channel3 savings and their PayPal check summary
   *
   * @returns OK
   *
   * @throws {@link Vaults.ListVaultsError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  listVaults(options?: RequestOptions): ApiPromise<VaultSummary[], Vaults.ListVaultsError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/vaults"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.lazy(() => vaultSummarySchema)) },
        errorFactory: Vaults.ListVaultsError,
      },
      options,
    );
  }

  /**
   * Ask PayPal again about pending payments of this vault
   *
   * @returns OK
   *
   * @throws {@link Vaults.SyncVaultError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  syncVault(
    request: Vaults.SyncVaultRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Vaults.SyncVaultError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/sync"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Vaults.SyncVaultError,
      },
      options,
    );
  }
}

export namespace Vaults {
  export type ChangeExpiryRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsExpiryRequest;
  };

  export class ChangeExpiryError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ChangeExpiryError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ChangePolicyRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsPolicyRequest;
  };

  export class ChangePolicyError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ChangePolicyError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CompilePolicyRequest = {
    body: ApiVaultsCompileRequest;
  };

  export class CompilePolicyError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CompilePolicyError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type CreateVaultRequest = {
    body: ApiVaultsRequest;
  };

  export class CreateVaultError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<CreateVaultError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type GetVaultRequest = {
    /** Vault id */
    id: string;
  };

  export class GetVaultError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<GetVaultError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type LiquidateVaultRequest = {
    /** Vault id */
    id: string;
  };

  export class LiquidateVaultError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<LiquidateVaultError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ListVaultDetailsRequest = {
    userId: string;
  };

  export class ListVaultDetailsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListVaultDetailsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export class ListVaultsError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ListVaultsError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type SyncVaultRequest = {
    /** Vault id */
    id: string;
  };

  export class SyncVaultError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<SyncVaultError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
