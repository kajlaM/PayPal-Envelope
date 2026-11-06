import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { channel31Schema, type Channel31 } from "./channel31.js";
import { policySchema, type Policy } from "./policy.js";
import { status2Schema, type Status2 } from "./status2.js";
import { totalsSchema, type Totals } from "./totals.js";
import { type1Schema, type Type1 } from "./type1.js";
import { verificationSchema, type Verification } from "./verification.js";

export type VaultSummary = {
  id?: string;
  userId?: string;
  name?: string;
  type?: Type1;
  status?: Status2;
  budgetCents?: number;
  balanceCents?: number;
  expiresAt?: Date;
  policy?: Policy;
  totals?: Totals;
  channel3?: Channel31 | null;
  verification?: Verification | null;
};

export const vaultSummarySchema: Schema<VaultSummary> = s.object<VaultSummary>({
  id: s.optional(s.string()),
  userId: s.optional(s.string()),
  name: s.optional(s.string()),
  type: s.optional(s.lazy(() => type1Schema)),
  status: s.optional(s.lazy(() => status2Schema)),
  budgetCents: s.optional(s.int()),
  balanceCents: s.optional(s.int()),
  expiresAt: s.optional(s.dateTime()),
  policy: s.optional(s.lazy(() => policySchema)),
  totals: s.optional(s.lazy(() => totalsSchema)),
  channel3: s.optionalNullable(s.lazy(() => channel31Schema)),
  verification: s.optionalNullable(s.lazy(() => verificationSchema)),
});
