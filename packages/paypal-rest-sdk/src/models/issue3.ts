import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue3 = {
  UserNotFound: "USER_NOT_FOUND",
} as const;
export type Issue3 = (typeof Issue3)[keyof typeof Issue3] | (string & {});

export const issue3Schema: EnumSchema<Issue3> = s.enumOf<Issue3>(Issue3);
