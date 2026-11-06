import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue12 = {
  InvalidStringLength: "INVALID_STRING_LENGTH",
} as const;
export type Issue12 = (typeof Issue12)[keyof typeof Issue12] | (string & {});

export const issue12Schema: EnumSchema<Issue12> = s.enumOf<Issue12>(Issue12);
