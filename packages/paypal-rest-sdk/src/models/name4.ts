import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name4 = {
  ResourceNotFound: "RESOURCE_NOT_FOUND",
} as const;
export type Name4 = (typeof Name4)[keyof typeof Name4] | (string & {});

export const name4Schema: EnumSchema<Name4> = s.enumOf<Name4>(Name4);
