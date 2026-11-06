import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description19 = {
  CurrencyCodeLengthShouldBe3Characters: "Currency code length should be 3 characters.",
} as const;
export type Description19 = (typeof Description19)[keyof typeof Description19] | (string & {});

export const description19Schema: EnumSchema<Description19> = s.enumOf<Description19>(Description19);
