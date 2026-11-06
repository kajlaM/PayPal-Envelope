import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { amountWithBreakdownSchema, type AmountWithBreakdown } from "./amount-with-breakdown.js";

/** The invoice amount summary of item total, discount, tax total, and shipping. */
export type InvoiceAmountSummary = {
  /**
   * The [three-character ISO-4217 currency code](/api/rest/reference/currency-codes/) that
   * identifies the currency.
   */
  currencyCode?: string;
  /**
   * The value, which might be:<ul><li>An integer for currencies like `JPY` that are not typically
   * fractional.</li><li>A decimal fraction for currencies like `TND` that are subdivided into
   * thousandths.</li></ul>For the required number of decimal places for a currency code, see
   * [Currency Codes](/docs/integration/direct/rest/currency-codes/).
   */
  value?: string;
  /**
   * The breakdown of the amount. Includes total item amount, total tax amount, custom amount, and
   * shipping and discounts, if any.
   */
  breakdown?: AmountWithBreakdown;
};

export const invoiceAmountSummarySchema: Schema<InvoiceAmountSummary> = s.object<InvoiceAmountSummary>({
  currencyCode: s.optional(s.string()),
  value: s.optional(s.string()),
  breakdown: s.optional(s.lazy(() => amountWithBreakdownSchema)),
  _keysMap: {
    currencyCode: "currency_code",
  },
});
