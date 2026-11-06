import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { paymentTermTypeSchema, type PaymentTermType } from "./payment-term-type.js";

/**
 * The payment term of the invoice. Payment can be due upon receipt, a specified date, or in a set
 * number of days.
 */
export type InvoicePaymentTerm = {
  /**
   * The payment term. Payment can be due upon receipt, a specified date, or in a set number of
   * days.
   */
  termType?: PaymentTermType;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  dueDate?: string;
};

export const invoicePaymentTermSchema: Schema<InvoicePaymentTerm> = s.object<InvoicePaymentTerm>({
  termType: s.optional(s.lazy(() => paymentTermTypeSchema)),
  dueDate: s.optional(s.string()),
  _keysMap: {
    termType: "term_type",
    dueDate: "due_date",
  },
});
