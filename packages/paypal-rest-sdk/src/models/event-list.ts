import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { eventSchema, type Event } from "./event.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";

/** A list of webhooks events. */
export type EventList = {
  /** An array of webhooks events. */
  events?: Event[];
  /**
   * The number of items in each range of results. Note that the response might have fewer items
   * than the requested `page_size` value.
   */
  count?: number;
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescriptionWebhooksManagement[];
};

export const eventListSchema: Schema<EventList> = s.object<EventList>({
  events: s.optional(s.array(s.lazy(() => eventSchema))),
  count: s.optional(s.int()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
});
