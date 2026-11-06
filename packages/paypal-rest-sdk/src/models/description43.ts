import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description43 = {
  ItemDescriptionLengthShouldBeLessThan1000Characters:
    "Item description length should be less than 1000 characters.",
} as const;
export type Description43 = (typeof Description43)[keyof typeof Description43] | (string & {});

export const description43Schema: EnumSchema<Description43> = s.enumOf<Description43>(Description43);
