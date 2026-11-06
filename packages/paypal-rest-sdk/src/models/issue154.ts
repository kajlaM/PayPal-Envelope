import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue154 = {
  PermissionDenied: "PERMISSION_DENIED",
} as const;
export type Issue154 = (typeof Issue154)[keyof typeof Issue154] | (string & {});

export const issue154Schema: EnumSchema<Issue154> = s.enumOf<Issue154>(Issue154);
