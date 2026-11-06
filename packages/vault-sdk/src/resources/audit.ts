import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { apiAuditAskRequestSchema, type ApiAuditAskRequest } from "../models/api-audit-ask-request.js";
import { errorSchema, type Error } from "../models/error.js";
import type { Servers } from "../servers.js";

/**
 * Elastic audit log and Audit Copilot
 */
export class Audit {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Audit Copilot: a question in plain English, answered from cited audit records
   *
   * @returns OK
   *
   * @throws {@link Audit.AskAuditError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  askAudit(
    request: Audit.AskAuditRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Audit.AskAuditError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/audit/ask"),
        auth: noneAuth,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiAuditAskRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Audit.AskAuditError,
      },
      options,
    );
  }

  /**
   * Rewrite every decision and payment into the audit log
   *
   * @remarks
   * Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).
   *
   * @returns OK
   *
   * @throws {@link Audit.ReindexAuditError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  reindexAudit(options?: RequestOptions): ApiPromise<Record<string, unknown>, Audit.ReindexAuditError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/audit/reindex"),
        auth: this.#auth.internalKey,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Audit.ReindexAuditError,
      },
      options,
    );
  }

  /**
   * Search the audit log (keyword + meaning)
   *
   * @returns OK
   *
   * @throws {@link Audit.SearchAuditError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  searchAudit(
    request: Audit.SearchAuditRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>[], Audit.SearchAuditError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/api/audit/search"),
        auth: noneAuth,
        pathParams: [],
        query: [
          { name: "q", value: request.q, schema: s.string() },
          { name: "vaultId", value: request.vaultId, schema: s.optional(s.string()) },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.array(s.record(s.string(), s.unknown())) },
        errorFactory: Audit.SearchAuditError,
      },
      options,
    );
  }
}

export namespace Audit {
  export type AskAuditRequest = {
    body: ApiAuditAskRequest;
  };

  export class AskAuditError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<AskAuditError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export class ReindexAuditError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ReindexAuditError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type SearchAuditRequest = {
    q: string;
    vaultId?: string;
  };

  export class SearchAuditError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<SearchAuditError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
