import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Rebalance = {
  Leftover: "LEFTOVER",
  None: "NONE",
} as const;
export type Rebalance = (typeof Rebalance)[keyof typeof Rebalance] | (string & {});

export const rebalanceSchema: EnumSchema<Rebalance> = s.enumOf<Rebalance>(Rebalance);
