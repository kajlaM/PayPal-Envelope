import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The payment type. Can be PayPal or an external payment. Includes cash or a check. */
export const PaymentType = {
  Paypal: "PAYPAL",
  External: "EXTERNAL",
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType] | (string & {});

export const paymentTypeSchema: EnumSchema<PaymentType> = s.enumOf<PaymentType>(PaymentType);
