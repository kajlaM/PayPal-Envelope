import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  currencyConversionResourceSchema,
  type CurrencyConversionResource,
} from "./currency-conversion-resource.js";
import { currencySchema, type Currency } from "./currency.js";
import { errorSchema, type Error } from "./error.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";
import { payoutItemDetailSchema, type PayoutItemDetail } from "./payout-item-detail.js";
import { transactionStatusSchema, type TransactionStatus } from "./transaction-status.js";

/**
 * The payout item status and other details. A <code>payout_item_id</code> helps you identify denied
 * payments. If a payment is denied, you can use the <code>payout_item_id</code> to identify the
 * payment even if it lacks a <code>transaction_id</code>.
 */
export type PayoutItem2 = {
  /** The ID for the payout item. Visible when you show details for a payout. */
  payoutItemId?: string;
  /** The PayPal-generated ID for the transaction. */
  transactionId?: string;
  /**
   * The unique PayPal-generated common ID that links the sender- and receiver-side transactions.
   * Used for tracking.
   */
  activityId?: string;
  /**
   * The item transaction status.<blockquote><strong>Note:</strong> For
   * <code>POST/v1/payments/payouts-item/{payout_item_id}/cancel</code>, the only possible
   * <code>transaction_status</code> value is <code>RETURNED</code>.</blockquote>
   */
  transactionStatus?: TransactionStatus;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  payoutItemFee?: Currency;
  /** The PayPal-generated ID for the payout batch. */
  payoutBatchId?: string;
  /**
   * A sender-specified ID. Tracks the payout in an accounting system. Should be unique within 30
   * days.
   */
  senderBatchId?: string;
  /** The details for a sender-created payout to a single recipient. */
  payoutItem?: PayoutItemDetail;
  /** The currency conversion resource. */
  currencyConversion?: CurrencyConversionResource;
  /**
   * The date and time when this item was last processed, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6).
   */
  timeProcessed?: Date;
  /** The error details. */
  errors?: Error;
  /** An array of request-related [HATEOAS links](/api/rest/responses/#hateoas-links). */
  links?: LinkDescriptionWebhooksManagement[];
};

export const payoutItem2Schema: Schema<PayoutItem2> = s.object<PayoutItem2>({
  payoutItemId: s.optional(s.string()),
  transactionId: s.optional(s.string()),
  activityId: s.optional(s.string()),
  transactionStatus: s.optional(s.lazy(() => transactionStatusSchema)),
  payoutItemFee: s.optional(s.lazy(() => currencySchema)),
  payoutBatchId: s.optional(s.string()),
  senderBatchId: s.optional(s.string()),
  payoutItem: s.optional(s.lazy(() => payoutItemDetailSchema)),
  currencyConversion: s.optional(s.lazy(() => currencyConversionResourceSchema)),
  timeProcessed: s.optional(s.dateTime()),
  errors: s.optional(s.lazy(() => errorSchema)),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    payoutItemId: "payout_item_id",
    transactionId: "transaction_id",
    activityId: "activity_id",
    transactionStatus: "transaction_status",
    payoutItemFee: "payout_item_fee",
    payoutBatchId: "payout_batch_id",
    senderBatchId: "sender_batch_id",
    payoutItem: "payout_item",
    currencyConversion: "currency_conversion",
    timeProcessed: "time_processed",
  },
});
