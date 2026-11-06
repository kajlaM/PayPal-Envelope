import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description20 = {
  BusinessNameLengthShouldBeLessThan300Characters: "Business name length should be less than 300 characters.",
} as const;
export type Description20 = (typeof Description20)[keyof typeof Description20] | (string & {});

export const description20Schema: EnumSchema<Description20> = s.enumOf<Description20>(Description20);
