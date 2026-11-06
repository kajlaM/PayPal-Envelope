import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue2 = {
  PermissionDenied: "PERMISSION_DENIED",
} as const;
export type Issue2 = (typeof Issue2)[keyof typeof Issue2] | (string & {});

export const issue2Schema: EnumSchema<Issue2> = s.enumOf<Issue2>(Issue2);
