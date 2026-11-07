import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** Last read-only check against PayPal's records; null = not checked yet */
export const PaypalCheck1 = {
  Verified: "VERIFIED",
  Waiting: "WAITING",
  Mismatch: "MISMATCH",
  Unchecked: "UNCHECKED",
} as const;
export type PaypalCheck1 = (typeof PaypalCheck1)[keyof typeof PaypalCheck1] | (string & {});

export const paypalCheck1Schema: EnumSchema<PaypalCheck1> = s.enumOf<PaypalCheck1>(PaypalCheck1);
