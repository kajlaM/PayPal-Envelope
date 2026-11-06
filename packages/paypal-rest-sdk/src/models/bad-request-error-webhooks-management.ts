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
import { nameWebhooksManagementSchema, type NameWebhooksManagement } from "./name-webhooks-management.js";

/** Request is not well-formed, syntactically incorrect, or violates schema. */
export type BadRequestErrorWebhooksManagement = {
  name?: NameWebhooksManagement;
  message?: string;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const badRequestErrorWebhooksManagementSchema: Schema<BadRequestErrorWebhooksManagement> =
  s.object<BadRequestErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => nameWebhooksManagementSchema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
