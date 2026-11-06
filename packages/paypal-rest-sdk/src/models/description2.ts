import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description2 = {
  UserIsNotAssociatedWithPaypalBasedOnInvoicerEmail:
    "User is not associated with paypal based on invoicer email.",
} as const;
export type Description2 = (typeof Description2)[keyof typeof Description2] | (string & {});

export const description2Schema: EnumSchema<Description2> = s.enumOf<Description2>(Description2);
