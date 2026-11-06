import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name8 = {
  InternalServerError: "INTERNAL_SERVER_ERROR",
} as const;
export type Name8 = (typeof Name8)[keyof typeof Name8] | (string & {});

export const name8Schema: EnumSchema<Name8> = s.enumOf<Name8>(Name8);
