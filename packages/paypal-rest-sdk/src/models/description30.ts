import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description30 = {
  CountryCodeLengthShouldBeBetween1And3: "country code length should be between 1 and 3.",
} as const;
export type Description30 = (typeof Description30)[keyof typeof Description30] | (string & {});

export const description30Schema: EnumSchema<Description30> = s.enumOf<Description30>(Description30);
