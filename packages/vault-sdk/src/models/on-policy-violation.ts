import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const OnPolicyViolation = {
  Block: "BLOCK",
  BlockAndAlert: "BLOCK_AND_ALERT",
} as const;
export type OnPolicyViolation = (typeof OnPolicyViolation)[keyof typeof OnPolicyViolation] | (string & {});

export const onPolicyViolationSchema: EnumSchema<OnPolicyViolation> =
  s.enumOf<OnPolicyViolation>(OnPolicyViolation);
