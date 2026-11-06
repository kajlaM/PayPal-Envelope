import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description110 = {
  UserIsRequiredToPassAuthChallenge: "User is required to pass auth challenge",
} as const;
export type Description110 = (typeof Description110)[keyof typeof Description110] | (string & {});

export const description110Schema: EnumSchema<Description110> = s.enumOf<Description110>(Description110);
