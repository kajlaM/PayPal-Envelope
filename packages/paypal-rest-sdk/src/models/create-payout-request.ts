import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { payoutItemSchema, type PayoutItem } from "./payout-item.js";
import { senderBatchHeaderSchema, type SenderBatchHeader } from "./sender-batch-header.js";

/** The create payout request. */
export type CreatePayoutRequest = {
  /** The sender-provided payout header for a payout request. */
  senderBatchHeader?: SenderBatchHeader;
  /** An array of individual payout items. */
  items?: PayoutItem[];
};

export const createPayoutRequestSchema: Schema<CreatePayoutRequest> = s.object<CreatePayoutRequest>({
  senderBatchHeader: s.optional(s.lazy(() => senderBatchHeaderSchema)),
  items: s.optional(s.array(s.lazy(() => payoutItemSchema))),
  _keysMap: {
    senderBatchHeader: "sender_batch_header",
  },
});
