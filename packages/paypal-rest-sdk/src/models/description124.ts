import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description124 = {
  AddressLine2LengthShouldBeLessThan300Characters: "Address line2 length should be less than 300 characters.",
} as const;
export type Description124 = (typeof Description124)[keyof typeof Description124] | (string & {});

export const description124Schema: EnumSchema<Description124> = s.enumOf<Description124>(Description124);
