import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue65 = {
  PaymentAmountGreaterThanAmountDue: "PAYMENT_AMOUNT_GREATER_THAN_AMOUNT_DUE",
} as const;
export type Issue65 = (typeof Issue65)[keyof typeof Issue65] | (string & {});

export const issue65Schema: EnumSchema<Issue65> = s.enumOf<Issue65>(Issue65);
