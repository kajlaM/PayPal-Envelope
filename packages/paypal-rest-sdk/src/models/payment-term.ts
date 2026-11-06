import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { paymentTermTypeSchema, type PaymentTermType } from "./payment-term-type.js";

/**
 * The payment term of the invoice. Payment can be due upon receipt, a specified date, or in a set
 * number of days.
 */
export type PaymentTerm = {
  /**
   * The payment term. Payment can be due upon receipt, a specified date, or in a set number of
   * days.
   */
  termType?: PaymentTermType;
};

export const paymentTermSchema: Schema<PaymentTerm> = s.object<PaymentTerm>({
  termType: s.optional(s.lazy(() => paymentTermTypeSchema)),
  _keysMap: {
    termType: "term_type",
  },
});
