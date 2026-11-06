import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { decisionSchema, type Decision } from "./decision.js";
import { ledgerEntry1Schema, type LedgerEntry1 } from "./unions/ledger-entry1.js";

export type SpendResultError = {
  decision?: Decision;
  ledgerEntry?: LedgerEntry1;
};

export const spendResultErrorSchema: Schema<SpendResultError> = s.object<SpendResultError>({
  decision: s.optional(s.lazy(() => decisionSchema)),
  ledgerEntry: s.optional(s.lazy(() => ledgerEntry1Schema)),
});
