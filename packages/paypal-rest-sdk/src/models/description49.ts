import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description49 = {
  CurrencyCodeIsNotSupported: "Currency code is not supported.",
} as const;
export type Description49 = (typeof Description49)[keyof typeof Description49] | (string & {});

export const description49Schema: EnumSchema<Description49> = s.enumOf<Description49>(Description49);
