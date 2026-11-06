import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Mismatch = {
  entryId?: string;
  note?: string;
};

export const mismatchSchema: Schema<Mismatch> = s.object<Mismatch>({
  entryId: s.optional(s.string()),
  note: s.optional(s.string()),
});
