import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The human-readable description for an issue. The description can change over the lifetime of an
 * API, so clients must not depend on this value.
 */
export const Description137 = {
  TemplateNameAlreadyExists: "Template name already exists.",
} as const;
export type Description137 = (typeof Description137)[keyof typeof Description137] | (string & {});

export const description137Schema: EnumSchema<Description137> = s.enumOf<Description137>(Description137);
