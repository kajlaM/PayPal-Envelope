import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** Resends a webhook event notification, by ID. */
export type EventResend = {
  /** An array of webhook account IDs. */
  webhookIds?: string[];
};

export const eventResendSchema: Schema<EventResend> = s.object<EventResend>({
  webhookIds: s.optional(s.array(s.string())),
  _keysMap: {
    webhookIds: "webhook_ids",
  },
});
