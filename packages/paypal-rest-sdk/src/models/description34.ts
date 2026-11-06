import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description34 = {
  ReferenceFieldLengthShouldBeLessThan120Characters:
    "Reference field length should be less than 120 characters.",
} as const;
export type Description34 = (typeof Description34)[keyof typeof Description34] | (string & {});

export const description34Schema: EnumSchema<Description34> = s.enumOf<Description34>(Description34);
