import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The item transaction status.<blockquote><strong>Note:</strong> For
 * <code>POST/v1/payments/payouts-item/{payout_item_id}/cancel</code>, the only possible
 * <code>transaction_status</code> value is <code>RETURNED</code>.</blockquote>
 */
export const TransactionStatus = {
  Success: "SUCCESS",
  Failed: "FAILED",
  Pending: "PENDING",
  Unclaimed: "UNCLAIMED",
  Returned: "RETURNED",
  Onhold: "ONHOLD",
  Blocked: "BLOCKED",
  Refunded: "REFUNDED",
  Reversed: "REVERSED",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus] | (string & {});

export const transactionStatusSchema: EnumSchema<TransactionStatus> =
  s.enumOf<TransactionStatus>(TransactionStatus);
