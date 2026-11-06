import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue1 = {
  InvalidIntegerMinValue: "INVALID_INTEGER_MIN_VALUE",
} as const;
export type Issue1 = (typeof Issue1)[keyof typeof Issue1] | (string & {});

export const issue1Schema: EnumSchema<Issue1> = s.enumOf<Issue1>(Issue1);
