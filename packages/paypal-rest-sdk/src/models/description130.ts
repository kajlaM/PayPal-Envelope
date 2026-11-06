import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description130 = {
  PaymentAmountIsGreaterThanTheAmountDue: "Payment amount is greater than the amount due.",
} as const;
export type Description130 = (typeof Description130)[keyof typeof Description130] | (string & {});

export const description130Schema: EnumSchema<Description130> = s.enumOf<Description130>(Description130);
