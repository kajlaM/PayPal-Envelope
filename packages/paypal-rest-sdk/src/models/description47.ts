import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description47 = {
  ValueOfTheFieldDoesNotConformToTheExpectedFormat:
    "Value of the field does not conform to the expected format.",
} as const;
export type Description47 = (typeof Description47)[keyof typeof Description47] | (string & {});

export const description47Schema: EnumSchema<Description47> = s.enumOf<Description47>(Description47);
