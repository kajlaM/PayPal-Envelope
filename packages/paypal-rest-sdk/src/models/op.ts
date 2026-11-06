import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The operation. */
export const Op = {
  Add: "add",
  Remove: "remove",
  Replace: "replace",
  Move: "move",
  Copy: "copy",
  Test: "test",
} as const;
export type Op = (typeof Op)[keyof typeof Op] | (string & {});

export const opSchema: EnumSchema<Op> = s.enumOf<Op>(Op);
