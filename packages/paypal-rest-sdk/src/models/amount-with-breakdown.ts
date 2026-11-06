import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { aggregatedDiscountSchema, type AggregatedDiscount } from "./aggregated-discount.js";
import { customAmountSchema, type CustomAmount } from "./custom-amount.js";
import { moneySchema, type Money } from "./money.js";
import { shippingCostSchema, type ShippingCost } from "./shipping-cost.js";

/**
 * The breakdown of the amount. Includes total item amount, total tax amount, custom amount, and
 * shipping and discounts, if any.
 */
export type AmountWithBreakdown = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  itemTotal?: Money;
  /**
   * The discount. Can be an item- or invoice-level discount, or both. Can be applied as a percent
   * or amount. If you provide both amount and percent, amount takes precedent.
   */
  discount?: AggregatedDiscount;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  taxTotal?: Money;
  /** The shipping fee for all items. Includes tax on shipping. */
  shipping?: ShippingCost;
  /**
   * The custom amount to apply to an invoice. If you include a label, you must include a custom
   * amount.
   */
  custom?: CustomAmount;
};

export const amountWithBreakdownSchema: Schema<AmountWithBreakdown> = s.object<AmountWithBreakdown>({
  itemTotal: s.optional(s.lazy(() => moneySchema)),
  discount: s.optional(s.lazy(() => aggregatedDiscountSchema)),
  taxTotal: s.optional(s.lazy(() => moneySchema)),
  shipping: s.optional(s.lazy(() => shippingCostSchema)),
  custom: s.optional(s.lazy(() => customAmountSchema)),
  _keysMap: {
    itemTotal: "item_total",
    taxTotal: "tax_total",
  },
});
