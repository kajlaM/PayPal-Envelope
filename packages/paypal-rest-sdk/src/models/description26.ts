import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description26 = {
  PostalCodeLengthShouldBeLessThan60Characters: "Postal code length should be less than 60 characters.",
} as const;
export type Description26 = (typeof Description26)[keyof typeof Description26] | (string & {});

export const description26Schema: EnumSchema<Description26> = s.enumOf<Description26>(Description26);
