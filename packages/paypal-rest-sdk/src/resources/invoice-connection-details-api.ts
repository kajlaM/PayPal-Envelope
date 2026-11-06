import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import * as s from "../core/validation/index.js";
import { badRequestErrorSchema, type BadRequestError } from "../models/bad-request-error.js";
import { internalServerErrorSchema, type InternalServerError } from "../models/internal-server-error.js";
import {
  invoiceConnectionDetailsSchema,
  type InvoiceConnectionDetails,
} from "../models/invoice-connection-details.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../models/not-authorized-error.js";
import { notFoundErrorSchema, type NotFoundError } from "../models/not-found-error.js";
import type { Servers } from "../servers.js";

/**
 * Use the `accounting-sync/invoices/{id}/connections` resource to get active connections list.
 */
export class InvoiceConnectionDetailsApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * List Connection Status for an Invoice.
   *
   * @remarks
   * Lists connections to accounting platforms per invoice.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body.
   *
   * @throws {@link InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError} when the API
   * answers with an error status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoiceConnectionDetailsGet(
    request: InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetRequest,
    options?: RequestOptions,
  ): ApiPromise<InvoiceConnectionDetails, InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/accounting-sync/invoices/{id}/connections"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: invoiceConnectionDetailsSchema },
        errorFactory: InvoiceConnectionDetailsApi.InvoiceConnectionDetailsGetError,
      },
      options,
    );
  }
}

export namespace InvoiceConnectionDetailsApi {
  export type InvoiceConnectionDetailsGetRequest = {
    /** The invoice id of the account. */
    id: string;
  };

  export class InvoiceConnectionDetailsGetError extends ApiError {
    declare readonly payload:
      | Declared<"badRequestError", BadRequestError>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoiceConnectionDetailsGetError> = [
      { on: 400, kind: "badRequestError", decode: { kind: "json", schema: badRequestErrorSchema } },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }
}
