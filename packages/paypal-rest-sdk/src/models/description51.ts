import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description51 = {
  AmountValueIsMissingPleaseProvideAValidAmount: "Amount value is missing. Please provide a valid amount.",
} as const;
export type Description51 = (typeof Description51)[keyof typeof Description51] | (string & {});

export const description51Schema: EnumSchema<Description51> = s.enumOf<Description51>(Description51);
