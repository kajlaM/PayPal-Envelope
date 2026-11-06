import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue54 = {
  MissingRequiredParameter: "MISSING_REQUIRED_PARAMETER",
} as const;
export type Issue54 = (typeof Issue54)[keyof typeof Issue54] | (string & {});

export const issue54Schema: EnumSchema<Issue54> = s.enumOf<Issue54>(Issue54);
