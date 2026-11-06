import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description140 = {
  GlobalTemplatesCannotBeDeleted: "Global templates cannot be deleted.",
} as const;
export type Description140 = (typeof Description140)[keyof typeof Description140] | (string & {});

export const description140Schema: EnumSchema<Description140> = s.enumOf<Description140>(Description140);
