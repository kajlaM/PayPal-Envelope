import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name5 = {
  ResourceConflict: "RESOURCE_CONFLICT",
} as const;
export type Name5 = (typeof Name5)[keyof typeof Name5] | (string & {});

export const name5Schema: EnumSchema<Name5> = s.enumOf<Name5>(Name5);
