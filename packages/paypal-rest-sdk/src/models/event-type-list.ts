import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { eventTypeSchema, type EventType } from "./event-type.js";

/** A list of webhook events. */
export type EventTypeList = {
  /** An array of webhook events. */
  eventTypes?: EventType[];
};

export const eventTypeListSchema: Schema<EventTypeList> = s.object<EventTypeList>({
  eventTypes: s.optional(s.array(s.lazy(() => eventTypeSchema))),
  _keysMap: {
    eventTypes: "event_types",
  },
});
