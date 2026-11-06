import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description21 = {
  MinimumDueAmountLengthShouldBeLessThan32Characters:
    "Minimum due amount length should be less than 32 characters.",
} as const;
export type Description21 = (typeof Description21)[keyof typeof Description21] | (string & {});

export const description21Schema: EnumSchema<Description21> = s.enumOf<Description21>(Description21);
