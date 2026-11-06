import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description64 = {
  CurrentInvoiceStateDoesNotSupportRefunds: "Current invoice state does not support refunds.",
} as const;
export type Description64 = (typeof Description64)[keyof typeof Description64] | (string & {});

export const description64Schema: EnumSchema<Description64> = s.enumOf<Description64>(Description64);
