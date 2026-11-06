import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description132 = {
  RecordedRefundsCannotExceedRecordedPayments: "Recorded refunds cannot exceed recorded payments.",
} as const;
export type Description132 = (typeof Description132)[keyof typeof Description132] | (string & {});

export const description132Schema: EnumSchema<Description132> = s.enumOf<Description132>(Description132);
