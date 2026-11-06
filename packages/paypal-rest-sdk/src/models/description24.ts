import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description24 = {
  TaxNameLengthShouldBeLessThan100: "Tax name length should be less than 100.",
} as const;
export type Description24 = (typeof Description24)[keyof typeof Description24] | (string & {});

export const description24Schema: EnumSchema<Description24> = s.enumOf<Description24>(Description24);
