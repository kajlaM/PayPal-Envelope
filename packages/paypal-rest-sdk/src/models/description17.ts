import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description17 = {
  SurnameLengthShouldBeLessThan140Characters: "Surname length should be less than 140 characters.",
} as const;
export type Description17 = (typeof Description17)[keyof typeof Description17] | (string & {});

export const description17Schema: EnumSchema<Description17> = s.enumOf<Description17>(Description17);
