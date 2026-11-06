import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description128 = {
  DraftInvoiceCannotBeCanceled: "Draft invoice cannot be canceled.",
} as const;
export type Description128 = (typeof Description128)[keyof typeof Description128] | (string & {});

export const description128Schema: EnumSchema<Description128> = s.enumOf<Description128>(Description128);
