import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** An event type. */
export type EventType = {
  /**
   * The unique event name.<blockquote><strong>Note:</strong> To subscribe to all events, including
   * events as they are added, specify an `*` as the value to represent a wildcard.</blockquote>
   */
  name?: string;
  /** A human-readable description of the event. */
  description?: string;
  /** The status of a webhook event. */
  status?: string;
  /** Identifier for the event type example: 1.0/2.0 etc. */
  resourceVersions?: string[];
};

export const eventTypeSchema: Schema<EventType> = s.object<EventType>({
  name: s.optional(s.string()),
  description: s.optional(s.string()),
  status: s.optional(s.string()),
  resourceVersions: s.optional(s.array(s.string())),
  _keysMap: {
    resourceVersions: "resource_versions",
  },
});
