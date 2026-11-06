import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescription1WebhooksManagementSchema,
  type LinkDescription1WebhooksManagement,
} from "./link-description1-webhooks-management.js";
import { message3Schema, type Message3 } from "./message3.js";
import { name8WebhooksManagementSchema, type Name8WebhooksManagement } from "./name8-webhooks-management.js";

/**
 * The server is temporarily unable to handle the request, for example, because of planned
 * maintenance or downtime.
 */
export type ServiceUnavailableErrorWebhooksManagement = {
  name?: Name8WebhooksManagement;
  message?: Message3;
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const serviceUnavailableErrorWebhooksManagementSchema: Schema<ServiceUnavailableErrorWebhooksManagement> =
  s.object<ServiceUnavailableErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name8WebhooksManagementSchema)),
    message: s.optional(s.lazy(() => message3Schema)),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
