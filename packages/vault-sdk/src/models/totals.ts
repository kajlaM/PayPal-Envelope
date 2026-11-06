import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Totals = {
  paidInCents?: number;
  spentCents?: number;
  refundedCents?: number;
};

export const totalsSchema: Schema<Totals> = s.object<Totals>({
  paidInCents: s.optional(s.int()),
  spentCents: s.optional(s.int()),
  refundedCents: s.optional(s.int()),
});
