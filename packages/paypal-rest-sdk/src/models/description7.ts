import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description7 = {
  InvoiceIsAlreadyCancelled: "Invoice is already cancelled.",
} as const;
export type Description7 = (typeof Description7)[keyof typeof Description7] | (string & {});

export const description7Schema: EnumSchema<Description7> = s.enumOf<Description7>(Description7);
