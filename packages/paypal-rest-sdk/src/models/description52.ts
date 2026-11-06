import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description52 = {
  AmountValueIsInvalidShouldBeANumericValue: "Amount value is invalid. Should be a numeric value.",
} as const;
export type Description52 = (typeof Description52)[keyof typeof Description52] | (string & {});

export const description52Schema: EnumSchema<Description52> = s.enumOf<Description52>(Description52);
