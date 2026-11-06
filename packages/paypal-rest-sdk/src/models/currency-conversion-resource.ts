import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { currencySchema, type Currency } from "./currency.js";

/** The currency conversion resource. */
export type CurrencyConversionResource = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  fromAmount?: Currency;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  toAmount?: Currency;
  /** The exchange rate that is applied for this payout. */
  exchangeRate?: string;
};

export const currencyConversionResourceSchema: Schema<CurrencyConversionResource> =
  s.object<CurrencyConversionResource>({
    fromAmount: s.optional(s.lazy(() => currencySchema)),
    toAmount: s.optional(s.lazy(() => currencySchema)),
    exchangeRate: s.optional(s.string()),
    _keysMap: {
      fromAmount: "from_amount",
      toAmount: "to_amount",
      exchangeRate: "exchange_rate",
    },
  });
