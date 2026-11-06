import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name2 = {
  AuthenticationFailure: "AUTHENTICATION_FAILURE",
} as const;
export type Name2 = (typeof Name2)[keyof typeof Name2] | (string & {});

export const name2Schema: EnumSchema<Name2> = s.enumOf<Name2>(Name2);
