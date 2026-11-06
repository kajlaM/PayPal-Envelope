import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue159 = {
  MissingRequiredParameter: "MISSING_REQUIRED_PARAMETER",
} as const;
export type Issue159 = (typeof Issue159)[keyof typeof Issue159] | (string & {});

export const issue159Schema: EnumSchema<Issue159> = s.enumOf<Issue159>(Issue159);
