import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The currency and amount for a financial transaction, such as a balance or payment due. */
export type Currency = {
  /**
   * The [three-character ISO-4217 currency code](/docs/integration/direct/rest/currency-codes/).
   */
  currency?: string;
  /**
   * The value, which might be:<ul><li>An integer for currencies like `JPY` that are not typically
   * fractional.</li><li>A decimal fraction for currencies like `TND` that are subdivided into
   * thousandths.</li></ul>For the required number of decimal places for a currency code, see
   * [Currency codes - ISO 4217](https://www.iso.org/iso-4217-currency-codes.html).
   */
  value?: string;
};

export const currencySchema: Schema<Currency> = s.object<Currency>({
  currency: s.optional(s.string()),
  value: s.optional(s.string()),
});
