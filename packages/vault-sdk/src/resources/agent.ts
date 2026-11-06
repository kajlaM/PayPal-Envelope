import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import {
  apiVaultsAgentNextRequestSchema,
  type ApiVaultsAgentNextRequest,
} from "../models/api-vaults-agent-next-request.js";
import {
  apiVaultsAgentRequestSchema,
  type ApiVaultsAgentRequest,
} from "../models/api-vaults-agent-request.js";
import { errorSchema, type Error } from "../models/error.js";
import type { Servers } from "../servers.js";

/**
 * PayPalVault's own AI agent (no outside agents)
 */
export class Agent {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;

  constructor(rawClient: RawClient, servers: Servers) {
    this.#rawClient = rawClient;
    this.#servers = servers;
  }

  /**
   * Run the vault's own AI agent now (it can only ask to buy, via requestPurchase)
   *
   * @returns Started
   *
   * @throws {@link Agent.RunAgentError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  runAgent(
    request: Agent.RunAgentRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Agent.RunAgentError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/agent"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsAgentRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Agent.RunAgentError,
      },
      options,
    );
  }

  /**
   * Move the agent's next check
   *
   * @returns OK
   *
   * @throws {@link Agent.ScheduleAgentError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  scheduleAgent(
    request: Agent.ScheduleAgentRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Agent.ScheduleAgentError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/agent/next"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: apiVaultsAgentNextRequestSchema },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Agent.ScheduleAgentError,
      },
      options,
    );
  }

  /**
   * Stop watching this vault
   *
   * @returns OK
   *
   * @throws {@link Agent.StopAgentError} when the API answers with an error status — narrow on
   * `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  stopAgent(
    request: Agent.StopAgentRequest,
    options?: RequestOptions,
  ): ApiPromise<Record<string, unknown>, Agent.StopAgentError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/agent/stop"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: s.record(s.string(), s.unknown()) },
        errorFactory: Agent.StopAgentError,
      },
      options,
    );
  }
}

export namespace Agent {
  export type RunAgentRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsAgentRequest;
  };

  export class RunAgentError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<RunAgentError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type ScheduleAgentRequest = {
    /** Vault id */
    id: string;
    body: ApiVaultsAgentNextRequest;
  };

  export class ScheduleAgentError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<ScheduleAgentError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }

  export type StopAgentRequest = {
    /** Vault id */
    id: string;
  };

  export class StopAgentError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<StopAgentError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error4", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
