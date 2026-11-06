import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { internalServerErrorSchema, type InternalServerError } from "../models/internal-server-error.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../models/not-authorized-error.js";
import { notFoundErrorSchema, type NotFoundError } from "../models/not-found-error.js";
import { templateSchema, type Template } from "../models/template.js";
import { templatesSchema, type Templates } from "../models/templates.js";
import {
  v2InvoicingTemplates400Error1Schema,
  type V2InvoicingTemplates400Error1,
} from "../models/v2-invoicing-templates400-error1.js";
import {
  v2InvoicingTemplates400Error21Schema,
  type V2InvoicingTemplates400Error21,
} from "../models/v2-invoicing-templates400-error21.js";
import {
  v2InvoicingTemplates403Error1Schema,
  type V2InvoicingTemplates403Error1,
} from "../models/v2-invoicing-templates403-error1.js";
import {
  v2InvoicingTemplates403Error31Schema,
  type V2InvoicingTemplates403Error31,
} from "../models/v2-invoicing-templates403-error31.js";
import {
  v2InvoicingTemplates422Error1Schema,
  type V2InvoicingTemplates422Error1,
} from "../models/v2-invoicing-templates422-error1.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/templates` resource to create, list, show details for, update, and delete invoice
 * templates. Use the `/templates` resource when you create a third-party invoicing application. For
 * instance, a business can create a template with predefined invoice data. Later, the business can
 * select the template to populate the invoice data.<blockquote><strong>Note:</strong> To upload a
 * logo to display on an invoice, you can use the <strong>Template Settings</strong> dashboard to <a
 * href="https://www.paypal.com/invoice/settings/templates">create a template</a>. When you create
 * an invoice, you can use the URI for that logo.</blockquote>
 */
export class TemplatesApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Create template
   *
   * @remarks
   * Creates an invoice template. You can use details from this template to create an invoice. You
   * can create up to 50 templates.<blockquote><strong>Note:</strong> Every merchant starts with
   * three PayPal system templates that are optimized for the unit type billed. The template
   * includes `Quantity`, `Hours`, and `Amount`.</blockquote>
   *
   * @returns A successful request returns the HTTP `201 Created` status code. A JSON response body
   * that shows template details is returned if you set <code>prefer=return=representation</code>.
   *
   * @throws {@link TemplatesApi.TemplatesCreateError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  templatesCreate(
    request: TemplatesApi.TemplatesCreateRequest,
    options?: RequestOptions,
  ): ApiPromise<Template, TemplatesApi.TemplatesCreateError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v2/invoicing/templates"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: templateSchema },
      },
      {
        success: { kind: "json", schema: templateSchema },
        errorFactory: TemplatesApi.TemplatesCreateError,
      },
      options,
    );
  }

  /**
   * Delete template
   *
   * @remarks
   * Deletes a template, by ID.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link TemplatesApi.TemplatesDeleteError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  templatesDelete(
    request: TemplatesApi.TemplatesDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, TemplatesApi.TemplatesDeleteError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v2/invoicing/templates/{template_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "template_id", value: request.templateId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "empty" },
        errorFactory: TemplatesApi.TemplatesDeleteError,
      },
      options,
    );
  }

  /**
   * Show template details
   *
   * @remarks
   * Shows details for a template, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows template details.
   *
   * @throws {@link TemplatesApi.TemplatesGetError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  templatesGet(
    request: TemplatesApi.TemplatesGetRequest,
    options?: RequestOptions,
  ): ApiPromise<Template, TemplatesApi.TemplatesGetError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/templates/{template_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "template_id", value: request.templateId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: templateSchema },
        errorFactory: TemplatesApi.TemplatesGetError,
      },
      options,
    );
  }

  /**
   * List templates
   *
   * @remarks
   * Lists merchant-created templates with associated details. The associated details include the
   * emails, addresses, and phone numbers from the user's PayPal profile.<br/>The user can select
   * which values to show in the business information section of their template.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists invoices.
   *
   * @throws {@link TemplatesApi.TemplatesListError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  templatesList(
    request: TemplatesApi.TemplatesListRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Templates, TemplatesApi.TemplatesListError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v2/invoicing/templates"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [
          { name: "fields", value: request.fields, schema: s.defaulted(s.string(), "all") },
          { name: "page", value: request.page, schema: s.defaulted(s.int(), 1) },
          { name: "page_size", value: request.pageSize, schema: s.defaulted(s.int(), 20) },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: templatesSchema },
        errorFactory: TemplatesApi.TemplatesListError,
      },
      options,
    );
  }

  /**
   * Fully update template
   *
   * @remarks
   * Fully updates a template, by ID. In the JSON request body, include a complete `template`
   * object. This call does not support partial updates.
   *
   * @returns A successful request returns the HTTP `200 OK` status code. A JSON response body that
   * shows template details is returned if you set <code>prefer=return=representation</code>.
   *
   * @throws {@link TemplatesApi.TemplatesUpdateError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  templatesUpdate(
    request: TemplatesApi.TemplatesUpdateRequest,
    options?: RequestOptions,
  ): ApiPromise<Template, TemplatesApi.TemplatesUpdateError> {
    return this.#rawClient.execute(
      {
        method: "PUT",
        urlTemplate: this.#servers.default("/v2/invoicing/templates/{template_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "template_id", value: request.templateId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: templateSchema },
      },
      {
        success: { kind: "json", schema: templateSchema },
        errorFactory: TemplatesApi.TemplatesUpdateError,
      },
      options,
    );
  }
}

export namespace TemplatesApi {
  export type TemplatesCreateRequest = {
    body: Template;
  };

  export class TemplatesCreateError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingTemplates400Error21", V2InvoicingTemplates400Error21>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"v2InvoicingTemplates422Error1", V2InvoicingTemplates422Error1>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<TemplatesCreateError> = [
      {
        on: 400,
        kind: "v2InvoicingTemplates400Error21",
        decode: { kind: "json", schema: v2InvoicingTemplates400Error21Schema },
      },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      {
        on: 422,
        kind: "v2InvoicingTemplates422Error1",
        decode: { kind: "json", schema: v2InvoicingTemplates422Error1Schema },
      },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type TemplatesDeleteRequest = {
    /** The ID of the template to delete. */
    templateId: string;
  };

  export class TemplatesDeleteError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingTemplates403Error31", V2InvoicingTemplates403Error31>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<TemplatesDeleteError> = [
      {
        on: 403,
        kind: "v2InvoicingTemplates403Error31",
        decode: { kind: "json", schema: v2InvoicingTemplates403Error31Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type TemplatesGetRequest = {
    /** The ID of the template to delete. */
    templateId: string;
  };

  export class TemplatesGetError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingTemplates403Error1", V2InvoicingTemplates403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<TemplatesGetError> = [
      {
        on: 403,
        kind: "v2InvoicingTemplates403Error1",
        decode: { kind: "json", schema: v2InvoicingTemplates403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type TemplatesListRequest = {
    /**
     * The fields to return in the response. Value is `all` or `none`. To return only the template
     * name, ID, and default attributes, specify `none`.
     *
     * @default "all"
     */
    fields?: string;
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
  };

  export class TemplatesListError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingTemplates400Error1", V2InvoicingTemplates400Error1>
      | Declared<"notAuthorizedError", NotAuthorizedError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<TemplatesListError> = [
      {
        on: 400,
        kind: "v2InvoicingTemplates400Error1",
        decode: { kind: "json", schema: v2InvoicingTemplates400Error1Schema },
      },
      { on: 403, kind: "notAuthorizedError", decode: { kind: "json", schema: notAuthorizedErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }

  export type TemplatesUpdateRequest = {
    /** The ID of the template to delete. */
    templateId: string;
    /** A representation of changes to make in the template. */
    body: Template;
  };

  export class TemplatesUpdateError extends ApiError {
    declare readonly payload:
      | Declared<"v2InvoicingTemplates400Error21", V2InvoicingTemplates400Error21>
      | Declared<"v2InvoicingTemplates403Error1", V2InvoicingTemplates403Error1>
      | Declared<"notFoundError", NotFoundError>
      | Declared<"internalServerError", InternalServerError>
      | Undeclared;

    static readonly errors: ErrorDecoders<TemplatesUpdateError> = [
      {
        on: 400,
        kind: "v2InvoicingTemplates400Error21",
        decode: { kind: "json", schema: v2InvoicingTemplates400Error21Schema },
      },
      {
        on: 403,
        kind: "v2InvoicingTemplates403Error1",
        decode: { kind: "json", schema: v2InvoicingTemplates403Error1Schema },
      },
      { on: 404, kind: "notFoundError", decode: { kind: "json", schema: notFoundErrorSchema } },
      { on: 500, kind: "internalServerError", decode: { kind: "json", schema: internalServerErrorSchema } },
    ];
  }
}
