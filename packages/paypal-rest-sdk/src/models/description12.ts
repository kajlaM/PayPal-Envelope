import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description12 = {
  CustomLabelLengthShouldBeLessThan50Characters: "Custom label length should be less than 50 characters.",
} as const;
export type Description12 = (typeof Description12)[keyof typeof Description12] | (string & {});

export const description12Schema: EnumSchema<Description12> = s.enumOf<Description12>(Description12);
