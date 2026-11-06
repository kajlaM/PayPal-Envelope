import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { badRequestErrorSchema, type BadRequestError } from "../models/bad-request-error.js";
import { connections1Schema, type Connections1 } from "../models/connections1.js";
import { internalServerErrorSchema, type InternalServerError } from "../models/internal-server-error.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../models/not-authorized-error.js";
import { notFoundErrorSchema, type NotFoundError } from "../models/not-found-error.js";
import type { Servers } from "../servers.js";

/**
 * Use the `accounting-sync/merchants/connections` resource to get active connections list.
 */
export class ConnectionsApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * List Connections.
   *
   * @remarks
   * Lists connections to accounting platforms per merchant.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body.
   *
   * @throws {@link ConnectionsApi.ConnectionsGetError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  connectionsGet(options?: RequestOptions): ApiPromise<Connections1, ConnectionsApi.ConnectionsGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/accounting-sync/merchant/connections"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: connections1Schema },
        errorFactory: ConnectionsApi.ConnectionsGetError,
      },
      options,
    );
  }
}

export namespace ConnectionsApi {
  export class ConnectionsGetError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<ConnectionsGetError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }
}
