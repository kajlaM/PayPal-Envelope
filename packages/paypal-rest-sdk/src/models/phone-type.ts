import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The phone type. */
export const PhoneType = {
  Fax: "FAX",
  Home: "HOME",
  Mobile: "MOBILE",
  Other: "OTHER",
  Pager: "PAGER",
} as const;
export type PhoneType = (typeof PhoneType)[keyof typeof PhoneType] | (string & {});

export const phoneTypeSchema: EnumSchema<PhoneType> = s.enumOf<PhoneType>(PhoneType);
