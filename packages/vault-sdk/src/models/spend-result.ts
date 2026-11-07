import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { decisionSchema, type Decision } from "./decision.js";

export type SpendResult = {
  decision?: Decision;
  /** The LedgerEntry of the payment, or null when nothing was paid */
  ledgerEntry?: Record<string, unknown> | null;
};

export const spendResultSchema: Schema<SpendResult> = s.object<SpendResult>({
  decision: s.optional(s.lazy(() => decisionSchema)),
  ledgerEntry: s.optionalNullable(s.record(s.string(), s.unknown())),
});
