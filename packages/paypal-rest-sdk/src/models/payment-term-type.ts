import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The payment term. Payment can be due upon receipt, a specified date, or in a set number of days.
 */
export const PaymentTermType = {
  DueOnReceipt: "DUE_ON_RECEIPT",
  DueOnDateSpecified: "DUE_ON_DATE_SPECIFIED",
  Net10: "NET_10",
  Net15: "NET_15",
  Net30: "NET_30",
  Net45: "NET_45",
  Net60: "NET_60",
  Net90: "NET_90",
  NoDueDate: "NO_DUE_DATE",
} as const;
export type PaymentTermType = (typeof PaymentTermType)[keyof typeof PaymentTermType] | (string & {});

export const paymentTermTypeSchema: EnumSchema<PaymentTermType> = s.enumOf<PaymentTermType>(PaymentTermType);
