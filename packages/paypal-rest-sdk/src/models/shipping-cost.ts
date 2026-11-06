import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";
import { taxSchema, type Tax } from "./tax.js";

/** The shipping fee for all items. Includes tax on shipping. */
export type ShippingCost = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /**
   * The tax information. Includes the tax name and tax rate of invoice items. The tax amount is
   * added to the item total.
   */
  tax?: Tax;
};

export const shippingCostSchema: Schema<ShippingCost> = s.object<ShippingCost>({
  amount: s.optional(s.lazy(() => moneySchema)),
  tax: s.optional(s.lazy(() => taxSchema)),
});
