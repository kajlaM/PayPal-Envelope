import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";

/** The webhook lookup details. */
export type WebhookLookup = {
  /** The ID of the webhook lookup. */
  id?: string;
  /** The application client ID. */
  clientId?: string;
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links/).
   */
  links?: LinkDescriptionWebhooksManagement[];
};

export const webhookLookupSchema: Schema<WebhookLookup> = s.object<WebhookLookup>({
  id: s.optional(s.string()),
  clientId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    clientId: "client_id",
  },
});
