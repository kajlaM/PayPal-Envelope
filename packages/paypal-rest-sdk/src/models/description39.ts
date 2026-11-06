import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description39 = {
  InvoiceDateIsInvalid: "Invoice date is invalid.",
} as const;
export type Description39 = (typeof Description39)[keyof typeof Description39] | (string & {});

export const description39Schema: EnumSchema<Description39> = s.enumOf<Description39>(Description39);
