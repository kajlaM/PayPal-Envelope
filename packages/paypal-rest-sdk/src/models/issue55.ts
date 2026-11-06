import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue55 = {
  InvalidPaymentMethod: "INVALID_PAYMENT_METHOD",
} as const;
export type Issue55 = (typeof Issue55)[keyof typeof Issue55] | (string & {});

export const issue55Schema: EnumSchema<Issue55> = s.enumOf<Issue55>(Issue55);
