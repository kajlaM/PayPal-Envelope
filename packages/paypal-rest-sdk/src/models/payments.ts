import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";
import { paymentDetailSchema, type PaymentDetail } from "./payment-detail.js";

/** An array of payments registered against the invoice. */
export type Payments = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  paidAmount?: Money;
  /**
   * An array of payment details for the invoice. The payment details of the invoice like payment
   * type, method, date, discount and transaction type.
   */
  transactions?: PaymentDetail[];
};

export const paymentsSchema: Schema<Payments> = s.object<Payments>({
  paidAmount: s.optional(s.lazy(() => moneySchema)),
  transactions: s.optional(s.array(s.lazy(() => paymentDetailSchema))),
  _keysMap: {
    paidAmount: "paid_amount",
  },
});
