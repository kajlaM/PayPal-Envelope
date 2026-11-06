import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";

/**
 * The discount as a percent or amount at invoice level. The invoice discount amount is subtracted
 * from the item total.
 */
export type Discount = {
  /**
   * The percentage, as a fixed-point, signed decimal number. For example, define a 19.99% interest
   * rate as `19.99`.
   */
  percent?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
};

export const discountSchema: Schema<Discount> = s.object<Discount>({
  percent: s.optional(s.string()),
  amount: s.optional(s.lazy(() => moneySchema)),
});
