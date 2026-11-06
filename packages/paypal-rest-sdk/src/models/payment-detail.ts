import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { contactInformationSchema, type ContactInformation } from "./contact-information.js";
import { moneySchema, type Money } from "./money.js";
import { paymentMethodSchema, type PaymentMethod } from "./payment-method.js";
import { paymentTypeSchema, type PaymentType } from "./payment-type.js";

/**
 * The payment details of the invoice. Includes payment type, method, date, discount, and
 * transaction type.
 */
export type PaymentDetail = {
  /** The payment type. Can be PayPal or an external payment. Includes cash or a check. */
  type?: PaymentType;
  /** The ID for a PayPal payment transaction. Required for the `PAYPAL` payment type. */
  paymentId?: string;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  paymentDate?: string;
  /** The payment mode or method through which the invoicer can accept the payments. */
  method?: PaymentMethod;
  /** A note associated with an external cash or check payment. */
  note?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The contact information of the user. Includes name and address. */
  shippingInfo?: ContactInformation;
};

export const paymentDetailSchema: Schema<PaymentDetail> = s.object<PaymentDetail>({
  type: s.optional(s.lazy(() => paymentTypeSchema)),
  paymentId: s.optional(s.string()),
  paymentDate: s.optional(s.string()),
  method: s.optional(s.lazy(() => paymentMethodSchema)),
  note: s.optional(s.string()),
  amount: s.optional(s.lazy(() => moneySchema)),
  shippingInfo: s.optional(s.lazy(() => contactInformationSchema)),
  _keysMap: {
    paymentId: "payment_id",
    paymentDate: "payment_date",
    shippingInfo: "shipping_info",
  },
});
