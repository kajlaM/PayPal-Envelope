import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { batchStatusSchema, type BatchStatus } from "./batch-status.js";
import { currencySchema, type Currency } from "./currency.js";
import { fundingSourceSchema, type FundingSource } from "./funding-source.js";
import { payoutSenderBatchHeaderSchema, type PayoutSenderBatchHeader } from "./payout-sender-batch-header.js";

/**
 * The payout header that is returned in response to a payout header request. Shows details for an
 * entire payout request.
 */
export type PayoutBatchHeader = {
  /** The PayPal-generated ID for a payout. */
  payoutBatchId?: string;
  /** The payouts status. */
  batchStatus?: BatchStatus;
  /**
   * The date and time when processing for the payout began, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6).
   */
  timeCreated?: Date;
  /**
   * The date and time when processing for the payout was completed, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6).
   */
  timeCompleted?: Date;
  /**
   * The date and time when the payout was closed, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). A payout is considered closed when
   * all items in a batch are processed and the available balance from the temporary hold is
   * released.
   */
  timeClosed?: Date;
  /** The sender-provided header for a payout request. */
  senderBatchHeader?: PayoutSenderBatchHeader;
  /** Identifies a funding source type. */
  fundingSource?: FundingSource;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Currency;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  fees?: Currency;
};

export const payoutBatchHeaderSchema: Schema<PayoutBatchHeader> = s.object<PayoutBatchHeader>({
  payoutBatchId: s.optional(s.string()),
  batchStatus: s.optional(s.lazy(() => batchStatusSchema)),
  timeCreated: s.optional(s.dateTime()),
  timeCompleted: s.optional(s.dateTime()),
  timeClosed: s.optional(s.dateTime()),
  senderBatchHeader: s.optional(s.lazy(() => payoutSenderBatchHeaderSchema)),
  fundingSource: s.optional(s.lazy(() => fundingSourceSchema)),
  amount: s.optional(s.lazy(() => currencySchema)),
  fees: s.optional(s.lazy(() => currencySchema)),
  _keysMap: {
    payoutBatchId: "payout_batch_id",
    batchStatus: "batch_status",
    timeCreated: "time_created",
    timeCompleted: "time_completed",
    timeClosed: "time_closed",
    senderBatchHeader: "sender_batch_header",
    fundingSource: "funding_source",
  },
});
