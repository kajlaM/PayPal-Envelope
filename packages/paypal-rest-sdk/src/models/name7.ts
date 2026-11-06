import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name7 = {
  UnprocessableEntity: "UNPROCESSABLE_ENTITY",
} as const;
export type Name7 = (typeof Name7)[keyof typeof Name7] | (string & {});

export const name7Schema: EnumSchema<Name7> = s.enumOf<Name7>(Name7);
