import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description33 = {
  InvoiceNoteLengthShouldBeLessThan4000Characters: "Invoice note length should be less than 4000 characters.",
} as const;
export type Description33 = (typeof Description33)[keyof typeof Description33] | (string & {});

export const description33Schema: EnumSchema<Description33> = s.enumOf<Description33>(Description33);
