import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description131 = {
  TheValueProvidedIsNotAnAcceptableMethodOfRefund:
    "The value provided is not an acceptable method of refund.",
} as const;
export type Description131 = (typeof Description131)[keyof typeof Description131] | (string & {});

export const description131Schema: EnumSchema<Description131> = s.enumOf<Description131>(Description131);
