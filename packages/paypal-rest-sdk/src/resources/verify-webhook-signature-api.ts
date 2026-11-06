import type { AuthSchemes } from "../auth-schemes.js";
import { ApiError } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import type { RawClient } from "../core/raw-client.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import {
  verifyWebhookSignatureResponseSchema,
  type VerifyWebhookSignatureResponse,
} from "../models/verify-webhook-signature-response.js";
import {
  verifyWebhookSignatureSchema,
  type VerifyWebhookSignature,
} from "../models/verify-webhook-signature.js";
import type { Servers } from "../servers.js";

/**
 * Use the `/verify-webhook-signature` resource to verify a webhook signature.
 */
export class VerifyWebhookSignatureApi {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;
  readonly #auth: AuthSchemes;

  constructor(rawClient: RawClient, servers: Servers, auth: AuthSchemes) {
    this.#rawClient = rawClient;
    this.#servers = servers;
    this.#auth = auth;
  }

  /**
   * Verify webhook signature
   *
   * @remarks
   * Verifies a webhook signature.
   *
   * @returns A successful request returns the HTTP `200 OK` status code and a JSON response body
   * that shows the verification status.
   *
   * @throws {@link ApiError} when the API answers with an error status
   *
   * @throws {@link InvoicesError} when no usable response was produced: a connection failure, a
   * timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  verifyWebhookSignaturePost(
    request: VerifyWebhookSignatureApi.VerifyWebhookSignaturePostRequest = {},
    options?: RequestOptions,
  ): ApiPromise<VerifyWebhookSignatureResponse, ApiError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/v1/notifications/verify-webhook-signature"),
        auth: this.#auth.oauth2,
        pathParams: [],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: {
          kind: "json",
          value: request.body,
          schema: s.optional(s.lazy(() => verifyWebhookSignatureSchema)),
        },
      },
      {
        success: { kind: "json", schema: verifyWebhookSignatureResponseSchema },
        errorFactory: ApiError,
      },
      options,
    );
  }
}

export namespace VerifyWebhookSignatureApi {
  export type VerifyWebhookSignaturePostRequest = {
    body?: VerifyWebhookSignature;
  };
}
