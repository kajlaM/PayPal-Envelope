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
import { message1Schema, type Message1 } from "./message1.js";
import { name3WebhooksManagementSchema, type Name3WebhooksManagement } from "./name3-webhooks-management.js";

/**
 * The server has not found anything matching the request URI. This either means that the URI is
 * incorrect or the resource is not available.
 */
export type NotFoundErrorWebhooksManagement = {
  name?: Name3WebhooksManagement;
  message?: Message1;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const notFoundErrorWebhooksManagementSchema: Schema<NotFoundErrorWebhooksManagement> =
  s.object<NotFoundErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name3WebhooksManagementSchema)),
    message: s.optional(s.lazy(() => message1Schema)),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
