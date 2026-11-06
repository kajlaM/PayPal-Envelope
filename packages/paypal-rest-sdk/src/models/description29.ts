import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description29 = {
  ItemNameLengthShouldBeLessThan200Characters: "Item name length should be less than 200 characters.",
} as const;
export type Description29 = (typeof Description29)[keyof typeof Description29] | (string & {});

export const description29Schema: EnumSchema<Description29> = s.enumOf<Description29>(Description29);
