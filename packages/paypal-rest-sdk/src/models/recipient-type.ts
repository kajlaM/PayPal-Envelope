import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The ID type that identifies the payment receiver. */
export const RecipientType = {
  Email: "EMAIL",
  Phone: "PHONE",
  PaypalId: "PAYPAL_ID",
} as const;
export type RecipientType = (typeof RecipientType)[keyof typeof RecipientType] | (string & {});

export const recipientTypeSchema: EnumSchema<RecipientType> = s.enumOf<RecipientType>(RecipientType);
