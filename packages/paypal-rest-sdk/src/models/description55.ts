import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description55 = {
  TheInvoiceTypeIsNotValidForPayingAnInvoice: "The invoice type is not valid for paying an invoice.",
} as const;
export type Description55 = (typeof Description55)[keyof typeof Description55] | (string & {});

export const description55Schema: EnumSchema<Description55> = s.enumOf<Description55>(Description55);
