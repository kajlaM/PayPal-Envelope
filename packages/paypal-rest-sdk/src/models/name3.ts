import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name3 = {
  NotAuthorized: "NOT_AUTHORIZED",
} as const;
export type Name3 = (typeof Name3)[keyof typeof Name3] | (string & {});

export const name3Schema: EnumSchema<Name3> = s.enumOf<Name3>(Name3);
