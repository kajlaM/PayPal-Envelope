import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue161 = {
  PaymentAmountGreaterThanAmountDue: "PAYMENT_AMOUNT_GREATER_THAN_AMOUNT_DUE",
} as const;
export type Issue161 = (typeof Issue161)[keyof typeof Issue161] | (string & {});

export const issue161Schema: EnumSchema<Issue161> = s.enumOf<Issue161>(Issue161);
