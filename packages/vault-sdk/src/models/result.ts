import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Result = {
  Approve: "APPROVE",
  Block: "BLOCK",
  NeedsHuman: "NEEDS_HUMAN",
} as const;
export type Result = (typeof Result)[keyof typeof Result] | (string & {});

export const resultSchema: EnumSchema<Result> = s.enumOf<Result>(Result);
