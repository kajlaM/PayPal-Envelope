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
import { name1WebhooksManagementSchema, type Name1WebhooksManagement } from "./name1-webhooks-management.js";

/**
 * Authentication failed due to missing Authorization header, or invalid authentication credentials.
 */
export type UnauthorizedErrorWebhooksManagement = {
  name?: Name1WebhooksManagement;
  message?: string;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const unauthorizedErrorWebhooksManagementSchema: Schema<UnauthorizedErrorWebhooksManagement> =
  s.object<UnauthorizedErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name1WebhooksManagementSchema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
