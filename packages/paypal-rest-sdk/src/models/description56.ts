import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description56 = {
  CurrentInvoiceStateDoesNotSupportPaymentProcessing:
    "Current invoice state does not support payment processing.",
} as const;
export type Description56 = (typeof Description56)[keyof typeof Description56] | (string & {});

export const description56Schema: EnumSchema<Description56> = s.enumOf<Description56>(Description56);
