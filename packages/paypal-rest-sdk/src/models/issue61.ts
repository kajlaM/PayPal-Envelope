import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue61 = {
  ValueCannotBeZero: "VALUE_CANNOT_BE_ZERO",
} as const;
export type Issue61 = (typeof Issue61)[keyof typeof Issue61] | (string & {});

export const issue61Schema: EnumSchema<Issue61> = s.enumOf<Issue61>(Issue61);
