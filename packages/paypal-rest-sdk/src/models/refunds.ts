import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";
import { refundDetailSchema, type RefundDetail } from "./refund-detail.js";

/** The invoicing refund details. Includes the refund type, date, amount, and method. */
export type Refunds = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  refundAmount?: Money;
  /**
   * An array of refund details for the invoice. Includes the refund type, date, amount, and method.
   */
  transactions?: RefundDetail[];
};

export const refundsSchema: Schema<Refunds> = s.object<Refunds>({
  refundAmount: s.optional(s.lazy(() => moneySchema)),
  transactions: s.optional(s.array(s.lazy(() => refundDetailSchema))),
  _keysMap: {
    refundAmount: "refund_amount",
  },
});
