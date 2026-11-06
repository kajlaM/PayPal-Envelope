import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description31 = {
  TemplateIdLengthShouldBeLessThan22Characters: "Template Id length should be less than 22 characters.",
} as const;
export type Description31 = (typeof Description31)[keyof typeof Description31] | (string & {});

export const description31Schema: EnumSchema<Description31> = s.enumOf<Description31>(Description31);
