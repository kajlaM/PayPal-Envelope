import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description121 = {
  ValueOfTheFieldIsEitherTooShortOrTooLong: "Value of the field is either too short or too long.",
} as const;
export type Description121 = (typeof Description121)[keyof typeof Description121] | (string & {});

export const description121Schema: EnumSchema<Description121> = s.enumOf<Description121>(Description121);
