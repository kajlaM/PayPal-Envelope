import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description115 = {
  ValueOfTheFieldIsTooLong: "Value of the field is too long.",
} as const;
export type Description115 = (typeof Description115)[keyof typeof Description115] | (string & {});

export const description115Schema: EnumSchema<Description115> = s.enumOf<Description115>(Description115);
