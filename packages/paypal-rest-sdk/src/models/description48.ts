import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description48 = {
  TheValueProvidedIsNotAnAcceptableMethodOfPayment:
    "The value provided is not an acceptable method of payment.",
} as const;
export type Description48 = (typeof Description48)[keyof typeof Description48] | (string & {});

export const description48Schema: EnumSchema<Description48> = s.enumOf<Description48>(Description48);
