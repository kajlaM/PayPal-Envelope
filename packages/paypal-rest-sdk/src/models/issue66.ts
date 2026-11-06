import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue66 = {
  InvalidInvoiceType: "INVALID_INVOICE_TYPE",
} as const;
export type Issue66 = (typeof Issue66)[keyof typeof Issue66] | (string & {});

export const issue66Schema: EnumSchema<Issue66> = s.enumOf<Issue66>(Issue66);
