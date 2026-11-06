import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description10 = {
  AddressLine1LengthShouldBeLessThan300Characters: "Address line1 length should be less than 300 characters.",
} as const;
export type Description10 = (typeof Description10)[keyof typeof Description10] | (string & {});

export const description10Schema: EnumSchema<Description10> = s.enumOf<Description10>(Description10);
