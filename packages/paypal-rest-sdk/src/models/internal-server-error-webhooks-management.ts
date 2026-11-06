import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescription1WebhooksManagementSchema,
  type LinkDescription1WebhooksManagement,
} from "./link-description1-webhooks-management.js";
import { message2Schema, type Message2 } from "./message2.js";
import { name7WebhooksManagementSchema, type Name7WebhooksManagement } from "./name7-webhooks-management.js";

/**
 * This is either a system or application error, and generally indicates that although the client
 * appeared to provide a correct request, something unexpected has gone wrong on the server.
 */
export type InternalServerErrorWebhooksManagement = {
  name?: Name7WebhooksManagement;
  message?: Message2;
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription1WebhooksManagement[];
};

export const internalServerErrorWebhooksManagementSchema: Schema<InternalServerErrorWebhooksManagement> =
  s.object<InternalServerErrorWebhooksManagement>({
    name: s.optional(s.lazy(() => name7WebhooksManagementSchema)),
    message: s.optional(s.lazy(() => message2Schema)),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescription1WebhooksManagementSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
