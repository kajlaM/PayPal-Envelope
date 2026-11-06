import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description54 = {
  PaymentAmountIsGreaterThanTheAmountDue: "Payment amount is greater than the amount due.",
} as const;
export type Description54 = (typeof Description54)[keyof typeof Description54] | (string & {});

export const description54Schema: EnumSchema<Description54> = s.enumOf<Description54>(Description54);
