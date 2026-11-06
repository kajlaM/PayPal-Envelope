import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description65 = {
  TheValueOfAFieldIsTooLong: "the value of a field is too long.",
} as const;
export type Description65 = (typeof Description65)[keyof typeof Description65] | (string & {});

export const description65Schema: EnumSchema<Description65> = s.enumOf<Description65>(Description65);
