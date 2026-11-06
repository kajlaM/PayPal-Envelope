import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  errorDetails1WebhooksManagementSchema,
  type ErrorDetails1WebhooksManagement,
} from "./error-details1-webhooks-management.js";
import {
  linkDescription1WebhooksManagementSchema,
  type LinkDescription1WebhooksManagement,
} from "./link-description1-webhooks-management.js";
import { name6WebhooksManagementSchema, type Name6WebhooksManagement } from "./name6-webhooks-management.js";

/**
 * The requested action cannot be performed and may require interaction with APIs or processes
 * outside of the current request. This is distinct from a 500 response in that there are no
 * systemic problems limiting the API from performing the request.
 */
export type UnprocessableEntityErrorWebhooksManagement = {
  name?: Name6WebhooksManagement;
  message?: string;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const unprocessableEntityErrorWebhooksManagementSchema: Schema<UnprocessableEntityErrorWebhooksManagement> =
  s.object<UnprocessableEntityErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name6WebhooksManagementSchema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
