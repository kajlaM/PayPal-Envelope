import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue152 = {
  InvalidIntegerMaxValue: "INVALID_INTEGER_MAX_VALUE",
} as const;
export type Issue152 = (typeof Issue152)[keyof typeof Issue152] | (string & {});

export const issue152Schema: EnumSchema<Issue152> = s.enumOf<Issue152>(Issue152);
