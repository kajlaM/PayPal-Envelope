import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description69 = {
  TheNumberOfItemsInAnArrayParameterIsTooLarge: "the number of items in an array parameter is too large.",
} as const;
export type Description69 = (typeof Description69)[keyof typeof Description69] | (string & {});

export const description69Schema: EnumSchema<Description69> = s.enumOf<Description69>(Description69);
