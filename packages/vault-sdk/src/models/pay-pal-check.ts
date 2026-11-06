import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** Last read-only check against PayPal's records */
export const PayPalCheck = {
  Verified: "VERIFIED",
  Waiting: "WAITING",
  Mismatch: "MISMATCH",
  Unchecked: "UNCHECKED",
} as const;
export type PayPalCheck = (typeof PayPalCheck)[keyof typeof PayPalCheck] | (string & {});

export const payPalCheckSchema: EnumSchema<PayPalCheck> = s.enumOf<PayPalCheck>(PayPalCheck);
