import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { webhookLookupSchema, type WebhookLookup } from "./webhook-lookup.js";

/** A list of webhook lookups. */
export type WebhookLookupList = {
  /** An array of webhook lookups. */
  webhooksLookups?: WebhookLookup[];
};

export const webhookLookupListSchema: Schema<WebhookLookupList> = s.object<WebhookLookupList>({
  webhooksLookups: s.optional(s.array(s.lazy(() => webhookLookupSchema))),
  _keysMap: {
    webhooksLookups: "webhooks_lookups",
  },
});
