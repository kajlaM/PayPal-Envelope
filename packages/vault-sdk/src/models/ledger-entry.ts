import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { statusSchema, type Status } from "./status.js";
import { typeSchema, type Type } from "./type.js";
import { paypalCheck1Schema, type PaypalCheck1 } from "./unions/paypal-check1.js";

export type LedgerEntry = {
  id?: string;
  vaultId?: string;
  type?: Type;
  status?: Status;
  amountCents?: number;
  paypalRef?: string | null;
  paidVia?: string | null;
  paypalCheck?: PaypalCheck1;
  paypalCheckedAt?: Date | null;
  paypalTxnId?: string | null;
  paypalCheckNote?: string | null;
  createdAt?: Date;
};

export const ledgerEntrySchema: Schema<LedgerEntry> = s.object<LedgerEntry>({
  id: s.optional(s.string()),
  vaultId: s.optional(s.string()),
  type: s.optional(s.lazy(() => typeSchema)),
  status: s.optional(s.lazy(() => statusSchema)),
  amountCents: s.optional(s.int()),
  paypalRef: s.optionalNullable(s.string()),
  paidVia: s.optionalNullable(s.string()),
  paypalCheck: s.optional(s.lazy(() => paypalCheck1Schema)),
  paypalCheckedAt: s.optionalNullable(s.dateTime()),
  paypalTxnId: s.optionalNullable(s.string()),
  paypalCheckNote: s.optionalNullable(s.string()),
  createdAt: s.optional(s.dateTime()),
});
