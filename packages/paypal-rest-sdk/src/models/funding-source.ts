import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** Identifies a funding source type. */
export const FundingSource = {
  Balance: "BALANCE",
} as const;
export type FundingSource = (typeof FundingSource)[keyof typeof FundingSource] | (string & {});

export const fundingSourceSchema: EnumSchema<FundingSource> = s.enumOf<FundingSource>(FundingSource);
