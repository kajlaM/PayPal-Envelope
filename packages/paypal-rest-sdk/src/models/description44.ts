import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description44 = {
  ShippingTaxNameLengthShouldBeLessThan100Characters:
    "Shipping Tax name length should be less than 100 characters.",
} as const;
export type Description44 = (typeof Description44)[keyof typeof Description44] | (string & {});

export const description44Schema: EnumSchema<Description44> = s.enumOf<Description44>(Description44);
