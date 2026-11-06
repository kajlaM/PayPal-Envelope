import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue166 = {
  InvalidRefundAmount: "INVALID_REFUND_AMOUNT",
} as const;
export type Issue166 = (typeof Issue166)[keyof typeof Issue166] | (string & {});

export const issue166Schema: EnumSchema<Issue166> = s.enumOf<Issue166>(Issue166);
