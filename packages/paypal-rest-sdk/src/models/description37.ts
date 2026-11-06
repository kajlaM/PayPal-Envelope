import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description37 = {
  AdditionalDataLengthShouldBeLessThan4000: "Additional data length should be less than 4000.",
} as const;
export type Description37 = (typeof Description37)[keyof typeof Description37] | (string & {});

export const description37Schema: EnumSchema<Description37> = s.enumOf<Description37>(Description37);
