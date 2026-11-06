import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { moneySchema, type Money } from "./money.js";

/** The amount range. */
export type AmountRange = {
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  lowerAmount?: Money;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  upperAmount?: Money;
};

export const amountRangeSchema: Schema<AmountRange> = s.object<AmountRange>({
  lowerAmount: s.optional(s.lazy(() => moneySchema)),
  upperAmount: s.optional(s.lazy(() => moneySchema)),
  _keysMap: {
    lowerAmount: "lower_amount",
    upperAmount: "upper_amount",
  },
});
