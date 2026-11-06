import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description = {
  ValueExceedsMaxValue: "Value exceeds max value.",
} as const;
export type Description = (typeof Description)[keyof typeof Description] | (string & {});

export const descriptionSchema: EnumSchema<Description> = s.enumOf<Description>(Description);
