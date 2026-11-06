import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue = {
  InvalidIntegerMaxValue: "INVALID_INTEGER_MAX_VALUE",
} as const;
export type Issue = (typeof Issue)[keyof typeof Issue] | (string & {});

export const issueSchema: EnumSchema<Issue> = s.enumOf<Issue>(Issue);
