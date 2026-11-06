import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { eventSchema, type Event } from "../models/event.js";
import { simulateEventSchema, type SimulateEvent } from "../models/simulate-event.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/simulate-event` resource to use a sample payload to simulate a webhook event. The
 * events that this call generates only serve to validate the connection to the listener URL and to
 * show how webhook events look. <blockquote><strong>Note:</strong> You can also use the <a
 * href="/docs/api/notifications/webhooks/simulator/">Webhooks simulator</a> to simulate webhook
 * events.</blockquote>
 */
export class SimulateEventApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Simulate webhook event
   *
   * @remarks
   * Simulates a webhook event. In the JSON request body, specify a sample payload.<br>You need to
   * subscribe to the following webhook events for Pay upon
   * Invoice:<br><table><thead><tr><th>Event</th><th>Trigger</th></tr></thead><tbody><tr><td><code>PAYMENT.CAPTURE.COMPLETED</code></td><td>A
   * payment capture completes.</td></tr><tr><td><code>PAYMENT.CAPTURE.DENIED</code></td><td>A
   * payment capture is
   * denied.</td></tr><tr><td><code>CHECKOUT.PAYMENT-APPROVAL.REVERSED</code></td><td>PayPal
   * reverses a payment capture.</td></tr></tbody></table>
   *
   * @returns A successful request returns the HTTP `202 Accepted` status code and a JSON response
   * body that shows details for the mock event.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  simulateEventPost(
    request: SimulateEventApi.SimulateEventPostRequest = {},
    options?: RequestOptions,
  ): ApiPromise<Event, ApiError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/notifications/simulate-event"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "json", value: request.body, schema: s.optional(s.lazy(() => simulateEventSchema)) },
      },
      {
        success: { kind: "json", schema: eventSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }
}

export namespace SimulateEventApi {
  export type SimulateEventPostRequest = {
    body?: SimulateEvent;
  };
}
