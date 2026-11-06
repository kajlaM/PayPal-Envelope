import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue4 = {
  InvalidStringMaxLength: "INVALID_STRING_MAX_LENGTH",
} as const;
export type Issue4 = (typeof Issue4)[keyof typeof Issue4] | (string & {});

export const issue4Schema: EnumSchema<Issue4> = s.enumOf<Issue4>(Issue4);
