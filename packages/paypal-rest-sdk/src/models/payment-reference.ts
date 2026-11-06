import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The reference to the payment detail. */
export type PaymentReference = {
  /** The ID for the invoice payment. */
  paymentId?: string;
};

export const paymentReferenceSchema: Schema<PaymentReference> = s.object<PaymentReference>({
  paymentId: s.optional(s.string()),
  _keysMap: {
    paymentId: "payment_id",
  },
});
