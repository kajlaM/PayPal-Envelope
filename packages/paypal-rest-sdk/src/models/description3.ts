import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description3 = {
  DraftInvoiceCannotBeCanceled: "Draft invoice cannot be canceled.",
} as const;
export type Description3 = (typeof Description3)[keyof typeof Description3] | (string & {});

export const description3Schema: EnumSchema<Description3> = s.enumOf<Description3>(Description3);
