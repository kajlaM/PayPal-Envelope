import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description112 = {
  TemplateNameLengthShouldBeBetween1And500: "Template name length should be between 1 and 500.",
} as const;
export type Description112 = (typeof Description112)[keyof typeof Description112] | (string & {});

export const description112Schema: EnumSchema<Description112> = s.enumOf<Description112>(Description112);
