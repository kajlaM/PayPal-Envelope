import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description41 = {
  InvoiceNumberLengthShouldBeLessThan25Characters: "Invoice number length should be less than 25 characters.",
} as const;
export type Description41 = (typeof Description41)[keyof typeof Description41] | (string & {});

export const description41Schema: EnumSchema<Description41> = s.enumOf<Description41>(Description41);
