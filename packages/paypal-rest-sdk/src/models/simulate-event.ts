import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** Simulates a mock webhook event. */
export type SimulateEvent = {
  /** The ID of the webhook. If omitted, the URL is required. */
  webhookId?: string;
  /** The URL for the webhook endpoint. If omitted, the webhook ID is required. */
  url?: string;
  /**
   * The event name. Specify one of the subscribed events. For each request, provide only one event.
   */
  eventType?: string;
  /** The identifier for event type ex: 1.0/2.0 etc. */
  resourceVersion?: string;
};

export const simulateEventSchema: Schema<SimulateEvent> = s.object<SimulateEvent>({
  webhookId: s.optional(s.string()),
  url: s.optional(s.string()),
  eventType: s.optional(s.string()),
  resourceVersion: s.optional(s.string()),
  _keysMap: {
    webhookId: "webhook_id",
    eventType: "event_type",
    resourceVersion: "resource_version",
  },
});
