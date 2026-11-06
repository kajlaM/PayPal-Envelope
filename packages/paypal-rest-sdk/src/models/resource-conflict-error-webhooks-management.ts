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
import { name4WebhooksManagementSchema, type Name4WebhooksManagement } from "./name4-webhooks-management.js";

/** The server has detected a conflict while processing this request. */
export type ResourceConflictErrorWebhooksManagement = {
  name?: Name4WebhooksManagement;
  message?: string;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const resourceConflictErrorWebhooksManagementSchema: Schema<ResourceConflictErrorWebhooksManagement> =
  s.object<ResourceConflictErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name4WebhooksManagementSchema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
