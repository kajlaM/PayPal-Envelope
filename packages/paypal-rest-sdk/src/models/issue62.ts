import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue62 = {
  InvalidDecimalValue: "INVALID_DECIMAL_VALUE",
} as const;
export type Issue62 = (typeof Issue62)[keyof typeof Issue62] | (string & {});

export const issue62Schema: EnumSchema<Issue62> = s.enumOf<Issue62>(Issue62);
