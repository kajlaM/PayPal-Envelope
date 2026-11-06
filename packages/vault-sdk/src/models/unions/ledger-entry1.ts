import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { ledgerEntrySchema, type LedgerEntry } from "../ledger-entry.js";

export type LedgerEntry1 = LedgerEntry;

export const ledgerEntry1Schema: Schema<LedgerEntry1> = s.of<LedgerEntry1>(
  s.union([s.lazy(() => ledgerEntrySchema)]),
);
