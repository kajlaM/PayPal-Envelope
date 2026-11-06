import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Every = {
  Day: "DAY",
  Week: "WEEK",
  Month: "MONTH",
} as const;
export type Every = (typeof Every)[keyof typeof Every] | (string & {});

export const everySchema: EnumSchema<Every> = s.enumOf<Every>(Every);
