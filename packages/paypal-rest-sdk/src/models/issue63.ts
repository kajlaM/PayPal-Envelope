import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue63 = {
  InvalidIntegerValue: "INVALID_INTEGER_VALUE",
} as const;
export type Issue63 = (typeof Issue63)[keyof typeof Issue63] | (string & {});

export const issue63Schema: EnumSchema<Issue63> = s.enumOf<Issue63>(Issue63);
