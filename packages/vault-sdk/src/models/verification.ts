import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Verification = {
  verified?: number;
  waiting?: number;
  mismatch?: number;
  unchecked?: number;
  notYet?: number;
  checkedAt?: Date;
};

export const verificationSchema: Schema<Verification> = s.object<Verification>({
  verified: s.optional(s.int()),
  waiting: s.optional(s.int()),
  mismatch: s.optional(s.int()),
  unchecked: s.optional(s.int()),
  notYet: s.optional(s.int()),
  checkedAt: s.optional(s.dateTime()),
});
