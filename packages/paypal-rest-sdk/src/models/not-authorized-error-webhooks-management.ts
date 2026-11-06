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
import { messageSchema, type Message } from "./message.js";
import { name2WebhooksManagementSchema, type Name2WebhooksManagement } from "./name2-webhooks-management.js";

/** The client is not authorized to access this resource, although it may have valid credentials. */
export type NotAuthorizedErrorWebhooksManagement = {
  name?: Name2WebhooksManagement;
  message?: Message;
  details?: ErrorDetails1WebhooksManagement[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const notAuthorizedErrorWebhooksManagementSchema: Schema<NotAuthorizedErrorWebhooksManagement> =
  s.object<NotAuthorizedErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name2WebhooksManagementSchema)),
    message: s.optional(s.lazy(() => messageSchema)),
    details: s.optional(s.array(s.lazy(() => errorDetails1WebhooksManagementSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
