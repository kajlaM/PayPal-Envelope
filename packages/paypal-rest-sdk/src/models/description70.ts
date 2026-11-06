import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description70 = {
  TheValueOfAFieldIsEitherTooShortOrTooLong: "the value of a field is either too short or too long.",
} as const;
export type Description70 = (typeof Description70)[keyof typeof Description70] | (string & {});

export const description70Schema: EnumSchema<Description70> = s.enumOf<Description70>(Description70);
