import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description62 = {
  RefundAmountCannotBeZero: "Refund amount cannot be zero.",
} as const;
export type Description62 = (typeof Description62)[keyof typeof Description62] | (string & {});

export const description62Schema: EnumSchema<Description62> = s.enumOf<Description62>(Description62);
