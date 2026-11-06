import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { eventListSchema, type EventList } from "../models/event-list.js";
import { eventResendSchema, type EventResend } from "../models/event-resend.js";
import { eventSchema, type Event } from "../models/event.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/webhooks-events` resource to list, show details for, and resend event notifications.
 */
export class WebhooksEvents {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Show event notification details
   *
   * @remarks
   * Shows details for a webhooks event notification, by ID.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows webhooks event notification details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksEventsGet(
    request: WebhooksEvents.WebhooksEventsGetRequest,
    options?: RequestOptions,
  ): ApiPromise<Event, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-events/{event_id}"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "event_id", value: request.eventId, schema: s.string() }],
        query: [],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: eventSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * List event notifications
   *
   * @remarks
   * Lists webhooks event notifications. Use query parameters to filter the response.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists webhooks event notifications.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksEventsList(
    request: WebhooksEvents.WebhooksEventsListRequest = {},
    options?: RequestOptions,
  ): ApiPromise<EventList, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-events"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [
          { name: "page_size", value: request.pageSize, schema: s.defaulted(s.int(), 10) },
          { name: "start_time", value: request.startTime, schema: s.optional(s.string()) },
          { name: "end_time", value: request.endTime, schema: s.optional(s.string()) },
          { name: "transaction_id", value: request.transactionId, schema: s.optional(s.string()) },
          { name: "event_type", value: request.eventType, schema: s.optional(s.string()) },
        ],
        headers: [],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: eventListSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }

  /**
   * Resend event notification
   *
   * @remarks
   * Resends a webhook event notification, by ID. Any pending notifications are not resent.
   *
   * @returns A successful request returns the HTTP `202 Accepted` status code and a JSON response
   * body that shows webhook event notification details.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksEventsResend(
    request: WebhooksEvents.WebhooksEventsResendRequest,
    options?: RequestOptions,
  ): ApiPromise<Event, ApiError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-events/{event_id}/resend"),
        auth: this.#auth.oauth2,
        pathParams: [{ name: "event_id", value: request.eventId, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => eventResendSchema)) },
      },
      {
        success: { kind: "json", schema: eventSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }
}

export namespace WebhooksEvents {
  export type WebhooksEventsGetRequest = {
    /** The ID of the webhook event notification to resend. */
    eventId: string;
  };

  export type WebhooksEventsListRequest = {
    /** The number of webhook event notifications to return in the response. @default 10 */
    pageSize?: number;
    /**
     * Filters the webhook event notifications in the response to those created on or after this
     * date and time and on or before the `end_time` value. Both values are in [Internet date and
     * time format](https://tools.ietf.org/html/rfc3339#section-5.6) format. Example:
     * `start_time=2013-03-06T11:00:00Z`.
     */
    startTime?: string;
    /**
     * Filters the webhook event notifications in the response to those created on or after the
     * `start_time` and on or before this date and time. Both values are in [Internet date and time
     * format](https://tools.ietf.org/html/rfc3339#section-5.6) format. Example:
     * `end_time=2013-03-06T11:00:00Z`.
     */
    endTime?: string;
    /** Filters the response to a single transaction, by ID. */
    transactionId?: string;
    /** Filters the response to a single event. */
    eventType?: string;
  };

  export type WebhooksEventsResendRequest = {
    /** The ID of the webhook event notification to resend. */
    eventId: string;
    body?: EventResend;
  };
}
