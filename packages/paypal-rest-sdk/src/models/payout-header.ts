import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { batchStatusSchema, type BatchStatus } from "./batch-status.js";
import { payoutSenderBatchHeaderSchema, type PayoutSenderBatchHeader } from "./payout-sender-batch-header.js";

/**
 * The payout header that is returned in response to a payout header request. Shows details for an
 * entire payout request.
 */
export type PayoutHeader = {
  /** The PayPal-generated ID for a payout. */
  payoutBatchId?: string;
  /** The payouts status. */
  batchStatus?: BatchStatus;
  /**
   * The date and time when processing for the payout began, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6).
   */
  timeCreated?: Date;
  /** The sender-provided header for a payout request. */
  senderBatchHeader?: PayoutSenderBatchHeader;
};

export const payoutHeaderSchema: Schema<PayoutHeader> = s.object<PayoutHeader>({
  payoutBatchId: s.optional(s.string()),
  batchStatus: s.optional(s.lazy(() => batchStatusSchema)),
  timeCreated: s.optional(s.dateTime()),
  senderBatchHeader: s.optional(s.lazy(() => payoutSenderBatchHeaderSchema)),
  _keysMap: {
    payoutBatchId: "payout_batch_id",
    batchStatus: "batch_status",
    timeCreated: "time_created",
    senderBatchHeader: "sender_batch_header",
  },
});
