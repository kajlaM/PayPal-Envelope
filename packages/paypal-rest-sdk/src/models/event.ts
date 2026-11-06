import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";

/** A webhook event notification. */
export type Event = {
  /** The ID of the webhook event notification. */
  id?: string;
  /**
   * The date and time when the webhook event notification was created, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6).
   */
  createTime?: Date;
  /** The name of the resource related to the webhook notification event. */
  resourceType?: string;
  /**
   * The event version in the webhook notification.
   *
   * @deprecated
   */
  eventVersion?: string;
  /** The event that triggered the webhook event notification. */
  eventType?: string;
  /** A summary description for the event notification. */
  summary?: string;
  /** The resource version in the webhook notification. */
  resourceVersion?: string;
  /** The resource that triggered the webhook event notification. */
  resource?: Record<string, unknown>;
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescriptionWebhooksManagement[];
};

export const eventSchema: Schema<Event> = s.object<Event>({
  id: s.optional(s.string()),
  createTime: s.optional(s.dateTime()),
  resourceType: s.optional(s.string()),
  eventVersion: s.optional(s.string()),
  eventType: s.optional(s.string()),
  summary: s.optional(s.string()),
  resourceVersion: s.optional(s.string()),
  resource: s.optional(s.record(s.string(), s.unknown())),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    createTime: "create_time",
    resourceType: "resource_type",
    eventVersion: "event_version",
    eventType: "event_type",
    resourceVersion: "resource_version",
  },
});
