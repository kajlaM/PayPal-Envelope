import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue142 = {
  CannotDeleteGlobalTemplate: "CANNOT_DELETE_GLOBAL_TEMPLATE",
} as const;
export type Issue142 = (typeof Issue142)[keyof typeof Issue142] | (string & {});

export const issue142Schema: EnumSchema<Issue142> = s.enumOf<Issue142>(Issue142);
