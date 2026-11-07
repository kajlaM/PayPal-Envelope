import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { decisionSchema, type Decision } from "./decision.js";

export type SpendResultError = {
  decision?: Decision;
  /** The LedgerEntry of the payment, or null when nothing was paid */
  ledgerEntry?: Record<string, unknown> | null;
};

export const spendResultErrorSchema: Schema<SpendResultError> = s.object<SpendResultError>({
  decision: s.optional(s.lazy(() => decisionSchema)),
  ledgerEntry: s.optionalNullable(s.record(s.string(), s.unknown())),
});
