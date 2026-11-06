import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description126 = {
  ValueExceedsMaxValue: "Value exceeds max value.",
} as const;
export type Description126 = (typeof Description126)[keyof typeof Description126] | (string & {});

export const description126Schema: EnumSchema<Description126> = s.enumOf<Description126>(Description126);
