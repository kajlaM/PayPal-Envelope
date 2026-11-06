import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description11 = {
  CountryCodeIsInvalid: "Country code is invalid.",
} as const;
export type Description11 = (typeof Description11)[keyof typeof Description11] | (string & {});

export const description11Schema: EnumSchema<Description11> = s.enumOf<Description11>(Description11);
