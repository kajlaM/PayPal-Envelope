import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The payment mode or method through which the invoicer can accept the payments. */
export const PaymentMethod = {
  BankTransfer: "BANK_TRANSFER",
  Cash: "CASH",
  Check: "CHECK",
  CreditCard: "CREDIT_CARD",
  DebitCard: "DEBIT_CARD",
  Paypal: "PAYPAL",
  WireTransfer: "WIRE_TRANSFER",
  Other: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod] | (string & {});

export const paymentMethodSchema: EnumSchema<PaymentMethod> = s.enumOf<PaymentMethod>(PaymentMethod);
