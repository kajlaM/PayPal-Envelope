import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description1 = {
  ValueLessThanMinimumValue: "Value less than minimum value.",
} as const;
export type Description1 = (typeof Description1)[keyof typeof Description1] | (string & {});

export const description1Schema: EnumSchema<Description1> = s.enumOf<Description1>(Description1);
