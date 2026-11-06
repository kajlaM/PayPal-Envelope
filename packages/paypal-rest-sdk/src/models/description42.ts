import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description42 = {
  ItemDateIsInvalid: "Item Date is invalid.",
} as const;
export type Description42 = (typeof Description42)[keyof typeof Description42] | (string & {});

export const description42Schema: EnumSchema<Description42> = s.enumOf<Description42>(Description42);
