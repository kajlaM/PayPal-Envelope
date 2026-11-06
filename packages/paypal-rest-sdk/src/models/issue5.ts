import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue5 = {
  InvalidArrayMaxItems: "INVALID_ARRAY_MAX_ITEMS",
} as const;
export type Issue5 = (typeof Issue5)[keyof typeof Issue5] | (string & {});

export const issue5Schema: EnumSchema<Issue5> = s.enumOf<Issue5>(Issue5);
