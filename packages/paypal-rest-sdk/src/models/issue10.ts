import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue10 = {
  InvoiceCanceledAlready: "INVOICE_CANCELED_ALREADY",
} as const;
export type Issue10 = (typeof Issue10)[keyof typeof Issue10] | (string & {});

export const issue10Schema: EnumSchema<Issue10> = s.enumOf<Issue10>(Issue10);
