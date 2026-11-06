import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description16 = {
  ItemQuantityLengthShouldBe1And14: "Item quantity length should be 1 and 14.",
} as const;
export type Description16 = (typeof Description16)[keyof typeof Description16] | (string & {});

export const description16Schema: EnumSchema<Description16> = s.enumOf<Description16>(Description16);
