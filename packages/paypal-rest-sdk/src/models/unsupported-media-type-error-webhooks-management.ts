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
import { name5WebhooksManagementSchema, type Name5WebhooksManagement } from "./name5-webhooks-management.js";

/** The server does not support the request payload's media type. */
export type UnsupportedMediaTypeErrorWebhooksManagement = {
  name?: Name5WebhooksManagement;
  message?: string;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const unsupportedMediaTypeErrorWebhooksManagementSchema: Schema<UnsupportedMediaTypeErrorWebhooksManagement> =
  s.object<UnsupportedMediaTypeErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name5WebhooksManagementSchema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
