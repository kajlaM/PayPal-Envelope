import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue80 = {
  InvalidRefundAmount: "INVALID_REFUND_AMOUNT",
} as const;
export type Issue80 = (typeof Issue80)[keyof typeof Issue80] | (string & {});

export const issue80Schema: EnumSchema<Issue80> = s.enumOf<Issue80>(Issue80);
