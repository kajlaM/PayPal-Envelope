import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";

/**
 * The partial payment details. Includes the minimum amount that the invoicer expects from the
 * payer.
 */
export type PartialPayment = {
  /**
   * Indicates whether the invoice allows a partial payment. If `false`, the invoice must be paid in
   * full. If `true`, the invoice allows partial payments.<blockquote><strong>Note:</strong> This
   * feature is not available for users in `India`, `Brazil`, or `Israel`.</blockquote>
   *
   * @default false
   */
  allowPartialPayment?: boolean;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  minimumAmountDue?: Money;
};

export const partialPaymentSchema: Schema<PartialPayment> = s.object<PartialPayment>({
  allowPartialPayment: s.defaulted(s.boolean(), false),
  minimumAmountDue: s.optional(s.lazy(() => moneySchema)),
  _keysMap: {
    allowPartialPayment: "allow_partial_payment",
    minimumAmountDue: "minimum_amount_due",
  },
});
