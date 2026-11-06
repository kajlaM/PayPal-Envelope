import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description138 = {
  CannotCancelADraftInvoice: "Cannot cancel a draft invoice.",
} as const;
export type Description138 = (typeof Description138)[keyof typeof Description138] | (string & {});

export const description138Schema: EnumSchema<Description138> = s.enumOf<Description138>(Description138);
