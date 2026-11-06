import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description129 = {
  TheValueProvidedIsNotAnAcceptableMethodOfPayment:
    "The value provided is not an acceptable method of payment.",
} as const;
export type Description129 = (typeof Description129)[keyof typeof Description129] | (string & {});

export const description129Schema: EnumSchema<Description129> = s.enumOf<Description129>(Description129);
