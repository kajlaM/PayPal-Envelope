import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description23 = {
  AdminArea2LengthShouldBeLessThan300Characters: "Admin area2 length should be less than 300 characters.",
} as const;
export type Description23 = (typeof Description23)[keyof typeof Description23] | (string & {});

export const description23Schema: EnumSchema<Description23> = s.enumOf<Description23>(Description23);
