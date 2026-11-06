import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { controlModeSchema, type ControlMode } from "./control-mode.js";
import { OnPolicyViolation, onPolicyViolationSchema } from "./on-policy-violation.js";

export type Rules = {
  maxSingleTransaction: number;
  allowedCategories: string[];
  approvedMerchants: string[];
  expiryTimestamp: Date;
  maxTransactionsPerDay?: number;
  humanApprovalAbove?: number;
  /** @default OnPolicyViolation.BlockAndAlert */
  onPolicyViolation?: OnPolicyViolation;
  controlMode?: ControlMode;
};

export const rulesSchema: Schema<Rules> = s.object<Rules>({
  maxSingleTransaction: s.float64(),
  allowedCategories: s.array(s.string()),
  approvedMerchants: s.array(s.string()),
  expiryTimestamp: s.dateTime(),
  maxTransactionsPerDay: s.optional(s.int()),
  humanApprovalAbove: s.optional(s.float64()),
  onPolicyViolation: s.defaulted(onPolicyViolationSchema, OnPolicyViolation.BlockAndAlert),
  controlMode: s.optional(s.lazy(() => controlModeSchema)),
  _keysMap: {
    maxSingleTransaction: "max_single_transaction",
    allowedCategories: "allowed_categories",
    approvedMerchants: "approved_merchants",
    expiryTimestamp: "expiry_timestamp",
    maxTransactionsPerDay: "max_transactions_per_day",
    humanApprovalAbove: "human_approval_above",
    onPolicyViolation: "on_policy_violation",
    controlMode: "control_mode",
  },
});
