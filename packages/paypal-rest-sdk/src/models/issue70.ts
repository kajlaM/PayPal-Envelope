import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue70 = {
  InvalidRefundMethod: "INVALID_REFUND_METHOD",
} as const;
export type Issue70 = (typeof Issue70)[keyof typeof Issue70] | (string & {});

export const issue70Schema: EnumSchema<Issue70> = s.enumOf<Issue70>(Issue70);
