import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { discountSchema, type Discount } from "./discount.js";
import { moneySchema, type Money } from "./money.js";

/**
 * The discount. Can be an item- or invoice-level discount, or both. Can be applied as a percent or
 * amount. If you provide both amount and percent, amount takes precedent.
 */
export type AggregatedDiscount = {
  /**
   * The discount as a percent or amount at invoice level. The invoice discount amount is subtracted
   * from the item total.
   */
  invoiceDiscount?: Discount;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  itemDiscount?: Money;
};

export const aggregatedDiscountSchema: Schema<AggregatedDiscount> = s.object<AggregatedDiscount>({
  invoiceDiscount: s.optional(s.lazy(() => discountSchema)),
  itemDiscount: s.optional(s.lazy(() => moneySchema)),
  _keysMap: {
    invoiceDiscount: "invoice_discount",
    itemDiscount: "item_discount",
  },
});
