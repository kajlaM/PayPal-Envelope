import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue151 = {
  UserNotFound: "USER_NOT_FOUND",
} as const;
export type Issue151 = (typeof Issue151)[keyof typeof Issue151] | (string & {});

export const issue151Schema: EnumSchema<Issue151> = s.enumOf<Issue151>(Issue151);
