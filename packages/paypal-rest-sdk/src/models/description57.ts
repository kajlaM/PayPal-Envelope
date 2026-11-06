import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description57 = {
  TheValueProvidedIsNotAnAcceptableMethodOfRefund:
    "The value provided is not an acceptable method of refund.",
} as const;
export type Description57 = (typeof Description57)[keyof typeof Description57] | (string & {});

export const description57Schema: EnumSchema<Description57> = s.enumOf<Description57>(Description57);
