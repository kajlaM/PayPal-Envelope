import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description13 = {
  GivenNameLengthShouldBeLessThan140Characters: "Given name length should be less than 140 characters.",
} as const;
export type Description13 = (typeof Description13)[keyof typeof Description13] | (string & {});

export const description13Schema: EnumSchema<Description13> = s.enumOf<Description13>(Description13);
