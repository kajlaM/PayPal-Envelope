import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { AnchorType, anchorTypeSchema } from "../models/anchor-type.js";
import { eventTypeListSchema, type EventTypeList } from "../models/event-type-list.js";
import { patchSchema, type Patch } from "../models/patch.js";
import { webhookListSchema, type WebhookList } from "../models/webhook-list.js";
import { webhookSchema, type Webhook } from "../models/webhook.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/webhooks` resource to subscribe your webhook listener to events, list webhooks for an
 * app, show details for, update, delete, and list event subscriptions for webhooks.
 */
export class Webhooks {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * List event subscriptions for webhook
   *
   * @remarks
   * Lists event subscriptions for a webhook, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists event subscriptions for a webhook.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  eventTypesList(
    request: Webhooks.EventTypesListRequest,
    options?: RequestOptions,
  ): ApiPromise<EventTypeList, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks/{webhook_id}/event-types"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_id", value: request.webhookId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: eventTypeListSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Delete webhook
   *
   * @remarks
   * Deletes a webhook, by ID.
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
  webhooksDelete(
    request: Webhooks.WebhooksDeleteRequest,
    options?: RequestOptions,
  ): ApiPromise<undefined, ApiError> {
    return this.#rawClient.execute(
      {
        method: "DELETE",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks/{webhook_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_id", value: request.webhookId, schema: s.string() }],
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
   * Show webhook details
   *
   * @remarks
   * Shows details for a webhook, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows webhook details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksGet(request: Webhooks.WebhooksGetRequest, options?: RequestOptions): ApiPromise<Webhook, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks/{webhook_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_id", value: request.webhookId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: webhookSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * List webhooks
   *
   * @remarks
   * Lists webhooks for an app.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists webhooks with webhook details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksList(
    request: Webhooks.WebhooksListRequest = {},
    options?: RequestOptions,
  ): ApiPromise<WebhookList, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [
          {
            name: "anchor_type",
            value: request.anchorType,
            schema: s.defaulted(anchorTypeSchema, AnchorType.Application),
          },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: webhookListSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Create webhook
   *
   * @remarks
   * Subscribes your webhook listener to events.
   *
   * @returns A successful request returns the HTTP `201 Created` status code and a JSON response
   * body with a [`webhook`](/docs/api/webhooks/v1/#definition-webhook) object that includes the
   * webhook ID for later use.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksPost(
    request: Webhooks.WebhooksPostRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Webhook, ApiError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => webhookSchema)) },
      },
      {
        success: { kind: "json", schema: webhookSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Update webhook
   *
   * @remarks
   * Updates a webhook to replace webhook fields with new values. Supports only the `replace`
   * operation. Pass a `json_patch` object with `replace` operation and `path`, which is `/url` for
   * a URL or `/event_types` for events. The `value` is either the URL or a list of events.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows webhook details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksUpdate(
    request: Webhooks.WebhooksUpdateRequest,
    options?: RequestOptions,
  ): ApiPromise<Webhook, ApiError> {
    return this.#rawClient.execute(
      {
        method: "PATCH",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks/{webhook_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "webhook_id", value: request.webhookId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.array(s.lazy(() => patchSchema))) },
      },
      {
        success: { kind: "json", schema: webhookSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }
}

export namespace Webhooks {
  export type EventTypesListRequest = {
    /** The ID of the webhook for which to list subscriptions. */
    webhookId: string;
  };

  export type WebhooksDeleteRequest = {
    /** The ID of the webhook for which to list subscriptions. */
    webhookId: string;
  };

  export type WebhooksGetRequest = {
    /** The ID of the webhook for which to list subscriptions. */
    webhookId: string;
  };

  export type WebhooksListRequest = {
    /**
     * Filters the webhooks in the response by an `anchor_id` entity type.
     *
     * @default AnchorType.Application
     */
    anchorType?: AnchorType;
  };

  export type WebhooksPostRequest = {
    body?: Webhook;
  };

  export type WebhooksUpdateRequest = {
    /** The ID of the webhook for which to list subscriptions. */
    webhookId: string;
    body?: Patch[];
  };
}
