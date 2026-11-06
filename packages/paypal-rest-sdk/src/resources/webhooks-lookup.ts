import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { webhookLookupListSchema, type WebhookLookupList } from "../models/webhook-lookup-list.js";
import { webhookLookupSchema, type WebhookLookup } from "../models/webhook-lookup.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/webhooks-lookup` resource to create, list, show details for, and delete webhook
 * lookups.
 */
export class WebhooksLookup {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Delete webhook lookup
   *
   * @remarks
   * Deletes a webhook lookup, by ID.
   *
   * @returns A successful request returns the HTTP `204 No Content` status code with no JSON
   * response body.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksLookupDelete(
    request: WebhooksLookup.WebhooksLookupDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, ApiError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-lookup/{webhook_lookup_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_lookup_id", value: request.webhookLookupId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "empty" },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Show webhook lookup details
   *
   * @remarks
   * Shows details for a webhook lookup, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows webhook lookup details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksLookupGet(
    request: WebhooksLookup.WebhooksLookupGetRequest,
    options?: RequestOptions,
  ): ApiPromise<WebhookLookup, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-lookup/{webhook_lookup_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_lookup_id", value: request.webhookLookupId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: webhookLookupSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * List webhook lookups
   *
   * @remarks
   * Lists webhook lookups.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists webhook lookups with webhook lookup details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksLookupList(options?: RequestOptions): ApiPromise<WebhookLookupList, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-lookup"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: webhookLookupListSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Create webhook lookup
   *
   * @remarks
   * Creates a webhook lookup. A webhook lookup ties the API caller's REST API app to the subject
   * account (or, if no subject is specified, to the API caller's account). If a webhook event is
   * generated for an event that is tied to the account but not to a particular REST API app (for
   * example, payments initiated with the NVP/SOAP APIs or through the user interface on
   * PayPal.com), those webhook events will treated as if they were intended for the REST API app
   * registered in the webhook lookup instead. Webhook events will then be delivered to any webhooks
   * registered to that REST API app.
   *
   * @returns A successful request returns the HTTP `201 Created` status code and a JSON response
   * body that shows webhook lookup details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksLookupPost(options?: RequestOptions): ApiPromise<WebhookLookup, ApiError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-lookup"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: webhookLookupSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }
}

export namespace WebhooksLookup {
  export type WebhooksLookupDeleteRequest = {
    /** The ID of the webhook lookup to delete. */
    webhookLookupId: string;
  };

  export type WebhooksLookupGetRequest = {
    /** The ID of the webhook lookup to delete. */
    webhookLookupId: string;
  };
}
