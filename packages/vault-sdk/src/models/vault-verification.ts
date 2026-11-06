import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { countsSchema, type Counts } from "./counts.js";
import { mismatchSchema, type Mismatch } from "./mismatch.js";

export type VaultVerification = {
  vaultId?: string;
  checkedAt?: Date;
  counts?: Counts;
  balanceMatches?: boolean;
  errors?: number;
  mismatches?: Mismatch[];
};

export const vaultVerificationSchema: Schema<VaultVerification> = s.object<VaultVerification>({
  vaultId: s.optional(s.string()),
  checkedAt: s.optional(s.dateTime()),
  counts: s.optional(s.lazy(() => countsSchema)),
  balanceMatches: s.optional(s.boolean()),
  errors: s.optional(s.int()),
  mismatches: s.optional(s.array(s.lazy(() => mismatchSchema))),
});
