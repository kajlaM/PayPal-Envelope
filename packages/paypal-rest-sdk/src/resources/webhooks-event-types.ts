import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import { eventTypeListSchema, type EventTypeList } from "../models/event-type-list.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/webhooks-event-types` resource to list available events to which any webhook can
 * subscribe.
 */
export class WebhooksEventTypes {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;

  constructor(rawClient: RawClient, servers: Servers) {
    this.#rawClient = rawClient;
    this.#servers = servers;
  }

  /**
   * List available events
   *
   * @remarks
   * Lists available events to which any webhook can subscribe. For a list of supported events, see
   * [Webhook event names](/docs/api/notifications/webhooks/event-names/).
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that lists available events to which any webhook can subscribe.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  webhooksEventTypesList(options?: RequestOptions): ApiPromise<EventTypeList, ApiError> {
    return this.#rawClient.execute(
      {
        method: "GET",
        urlTemplate: this.#servers.default("/v1/notifications/webhooks-event-types"),
        auth: noneAuth,
        pathParams: [],
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
}
