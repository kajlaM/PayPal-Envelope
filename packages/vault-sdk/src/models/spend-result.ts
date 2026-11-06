import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { decisionSchema, type Decision } from "./decision.js";
import { ledgerEntry1Schema, type LedgerEntry1 } from "./unions/ledger-entry1.js";

export type SpendResult = {
  decision?: Decision;
  ledgerEntry?: LedgerEntry1;
};

export const spendResultSchema: Schema<SpendResult> = s.object<SpendResult>({
  decision: s.optional(s.lazy(() => decisionSchema)),
  ledgerEntry: s.optional(s.lazy(() => ledgerEntry1Schema)),
});
