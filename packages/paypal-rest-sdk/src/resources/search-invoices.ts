import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { internalServerErrorSchema, type InternalServerError } from "../models/internal-server-error.js";
import { invoicesSchema, type Invoices } from "../models/invoices.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../models/not-authorized-error.js";
import { searchDataSchema, type SearchData } from "../models/search-data.js";
import {
  v2InvoicingSearchInvoices400Error1Schema,
  type V2InvoicingSearchInvoices400Error1,
} from "../models/v2-invoicing-search-invoices400-error1.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/search-invoices` resource to search for and list invoices that match search criteria.
 */
export class SearchInvoices {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Search for invoices
   *
   * @remarks
   * Searches for and lists invoices that match search criteria. If you pass multiple criteria, the
   * response lists invoices that match all criteria.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists the invoices that match the search criteria.
   *
   * @throws {@link SearchInvoices.InvoicesSearchInvoicesError} when the API answers with an error
   * status — narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  invoicesSearchInvoices(
    request: SearchInvoices.InvoicesSearchInvoicesRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Invoices, SearchInvoices.InvoicesSearchInvoicesError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/search-invoices"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [
          { name: "page", value: request.page, schema: s.defaulted(s.int(), 1) },
          { name: "page_size", value: request.pageSize, schema: s.defaulted(s.int(), 20) },
          { name: "total_required", value: request.totalRequired, schema: s.defaulted(s.boolean(), false) },
        ],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => searchDataSchema)) },
      },
      {
        success: { kind: "json", schema: invoicesSchema },
        errorFactory: SearchInvoices.InvoicesSearchInvoicesError,
      },
      options,
    );
  }
}

export namespace SearchInvoices {
  export type InvoicesSearchInvoicesRequest = {
    /**
     * The page number to be retrieved, for the list of templates. So, a combination of `page=1` and
     * `page_size=20` returns the first 20 templates. A combination of `page=2` and `page_size=20`
     * returns the next 20 templates.
     *
     * @default 1
     */
    page?: number;
    /** The maximum number of templates to return in the response. @default 20 */
    pageSize?: number;
    /**
     * Indicates whether the to show <code>total_pages</code> and <code>total_items</code> in the
     * response.
     *
     * @default false
     */
    totalRequired?: boolean;
    /** The invoice search can be used to retrieve the invoices based on the search parameters. */
    body?: SearchData;
  };

  export class InvoicesSearchInvoicesError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingSearchInvoices400Error1", V2InvoicingSearchInvoices400Error1>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<InvoicesSearchInvoicesError> = [
      {
        on: 400,
        kind: "v2InvoicingSearchInvoices400Error1",
        decode: { kind: "json", schema: v2InvoicingSearchInvoices400Error1Schema },
      },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }
}
