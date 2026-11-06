import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";

/**
 * The tax information. Includes the tax name and tax rate of invoice items. The tax amount is added
 * to the item total.
 */
export type Tax = {
  /** The name of the tax applied on the invoice items. */
  name?: string;
  /**
   * The percentage, as a fixed-point, signed decimal number. For example, define a 19.99% interest
   * rate as `19.99`.
   */
  percent?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The tax note used to track the tax related data. */
  taxNote?: string;
};

export const taxSchema: Schema<Tax> = s.object<Tax>({
  name: s.optional(s.string()),
  percent: s.optional(s.string()),
  amount: s.optional(s.lazy(() => moneySchema)),
  taxNote: s.optional(s.string()),
  _keysMap: {
    taxNote: "tax_note",
  },
});
