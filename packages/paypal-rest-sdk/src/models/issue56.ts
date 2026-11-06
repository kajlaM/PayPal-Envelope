import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue56 = {
  NotSupported: "NOT_SUPPORTED",
} as const;
export type Issue56 = (typeof Issue56)[keyof typeof Issue56] | (string & {});

export const issue56Schema: EnumSchema<Issue56> = s.enumOf<Issue56>(Issue56);
