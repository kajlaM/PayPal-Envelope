import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { eventTypeSchema, type EventType } from "./event-type.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";

/** One or more webhook objects. */
export type Webhook = {
  /** The ID of the webhook. */
  id?: string;
  /**
   * The URL that is configured to listen on `localhost` for incoming `POST` notification messages
   * that contain event information.
   */
  url?: string;
  /**
   * An array of events to which to subscribe your webhook. To subscribe to all events, including
   * events as they are added, specify the asterisk wild card. To replace the `event_types` array,
   * specify the asterisk wild card. To list all supported events, <a href="#event-type_list">list
   * available events</a>.
   */
  eventTypes?: EventType[];
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links/).
   */
  links?: LinkDescriptionWebhooksManagement[];
};

export const webhookSchema: Schema<Webhook> = s.object<Webhook>({
  id: s.optional(s.string()),
  url: s.optional(s.string()),
  eventTypes: s.optional(s.array(s.lazy(() => eventTypeSchema))),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    eventTypes: "event_types",
  },
});
