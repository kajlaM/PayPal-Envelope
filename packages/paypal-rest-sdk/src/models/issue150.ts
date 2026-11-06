import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue150 = {
  InvalidStringMaxLength: "INVALID_STRING_MAX_LENGTH",
} as const;
export type Issue150 = (typeof Issue150)[keyof typeof Issue150] | (string & {});

export const issue150Schema: EnumSchema<Issue150> = s.enumOf<Issue150>(Issue150);
