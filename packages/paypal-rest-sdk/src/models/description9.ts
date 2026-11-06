import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description9 = {
  NationalNumberLengthShouldBeBetween1And14: "National Number length should be between 1 and 14.",
} as const;
export type Description9 = (typeof Description9)[keyof typeof Description9] | (string & {});

export const description9Schema: EnumSchema<Description9> = s.enumOf<Description9>(Description9);
