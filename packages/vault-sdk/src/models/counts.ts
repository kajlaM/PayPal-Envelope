import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Counts = {
  verified?: number;
  waiting?: number;
  mismatch?: number;
  unchecked?: number;
};

export const countsSchema: Schema<Counts> = s.object<Counts>({
  verified: s.optional(s.int()),
  waiting: s.optional(s.int()),
  mismatch: s.optional(s.int()),
  unchecked: s.optional(s.int()),
  _keysMap: {
    verified: "VERIFIED",
    waiting: "WAITING",
    mismatch: "MISMATCH",
    unchecked: "UNCHECKED",
  },
});
