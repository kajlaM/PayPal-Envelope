import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description8 = {
  AddressLine2LengthShouldBeLessThan300Characters: "Address line2 length should be less than 300 characters.",
} as const;
export type Description8 = (typeof Description8)[keyof typeof Description8] | (string & {});

export const description8Schema: EnumSchema<Description8> = s.enumOf<Description8>(Description8);
