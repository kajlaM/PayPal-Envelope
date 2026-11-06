import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description125 = {
  UserIsNotAssociatedWithPaypalBasedOnInvoicerEmail:
    "User is not associated with paypal based on invoicer email.",
} as const;
export type Description125 = (typeof Description125)[keyof typeof Description125] | (string & {});

export const description125Schema: EnumSchema<Description125> = s.enumOf<Description125>(Description125);
