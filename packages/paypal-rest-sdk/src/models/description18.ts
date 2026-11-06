import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description18 = {
  CountryCodeLengthShouldBe2Characters: "Country code length should be 2 characters.",
} as const;
export type Description18 = (typeof Description18)[keyof typeof Description18] | (string & {});

export const description18Schema: EnumSchema<Description18> = s.enumOf<Description18>(Description18);
