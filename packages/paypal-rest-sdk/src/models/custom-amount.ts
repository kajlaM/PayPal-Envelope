import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";

/**
 * The custom amount to apply to an invoice. If you include a label, you must include a custom
 * amount.
 */
export type CustomAmount = {
  /** The label to the custom amount of the invoice. */
  label?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
};

export const customAmountSchema: Schema<CustomAmount> = s.object<CustomAmount>({
  label: s.optional(s.string()),
  amount: s.optional(s.lazy(() => moneySchema)),
});
