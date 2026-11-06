import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description127 = {
  TheValueOfAFieldIsTooLong: "the value of a field is too long.",
} as const;
export type Description127 = (typeof Description127)[keyof typeof Description127] | (string & {});

export const description127Schema: EnumSchema<Description127> = s.enumOf<Description127>(Description127);
