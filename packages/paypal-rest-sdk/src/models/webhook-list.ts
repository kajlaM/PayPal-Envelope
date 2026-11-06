import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { webhookSchema, type Webhook } from "./webhook.js";

/** A list of webhooks. */
export type WebhookList = {
  /** An array of webhooks. */
  webhooks?: Webhook[];
};

export const webhookListSchema: Schema<WebhookList> = s.object<WebhookList>({
  webhooks: s.optional(s.array(s.lazy(() => webhookSchema))),
});
