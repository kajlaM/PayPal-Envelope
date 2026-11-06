import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue14 = {
  InvalidParameterSyntax: "INVALID_PARAMETER_SYNTAX",
} as const;
export type Issue14 = (typeof Issue14)[keyof typeof Issue14] | (string & {});

export const issue14Schema: EnumSchema<Issue14> = s.enumOf<Issue14>(Issue14);
