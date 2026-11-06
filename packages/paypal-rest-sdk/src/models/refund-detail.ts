import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";
import { paymentMethodSchema, type PaymentMethod } from "./payment-method.js";
import { paymentTypeSchema, type PaymentType } from "./payment-type.js";

/** The refund details of the invoice. Includes the refund type, date, amount, and method. */
export type RefundDetail = {
  /** The payment type. Can be PayPal or an external payment. Includes cash or a check. */
  type?: PaymentType;
  /** The ID for a PayPal payment transaction. Required for the `PAYPAL` payment type. */
  refundId?: string;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  refundDate?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The payment mode or method through which the invoicer can accept the payments. */
  method?: PaymentMethod;
};

export const refundDetailSchema: Schema<RefundDetail> = s.object<RefundDetail>({
  type: s.optional(s.lazy(() => paymentTypeSchema)),
  refundId: s.optional(s.string()),
  refundDate: s.optional(s.string()),
  amount: s.optional(s.lazy(() => moneySchema)),
  method: s.optional(s.lazy(() => paymentMethodSchema)),
  _keysMap: {
    refundId: "refund_id",
    refundDate: "refund_date",
  },
});
