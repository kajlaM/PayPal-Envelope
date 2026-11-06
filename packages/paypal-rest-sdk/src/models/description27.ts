import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description27 = {
  NationalNumberIsNotValid: "National Number is not valid.",
} as const;
export type Description27 = (typeof Description27)[keyof typeof Description27] | (string & {});

export const description27Schema: EnumSchema<Description27> = s.enumOf<Description27>(Description27);
