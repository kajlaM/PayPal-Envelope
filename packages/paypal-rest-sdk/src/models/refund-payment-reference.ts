import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The reference to the refund payment detail. */
export type RefundPaymentReference = {
  /** The ID of the refund of an invoice payment. */
  refundId?: string;
};

export const refundPaymentReferenceSchema: Schema<RefundPaymentReference> = s.object<RefundPaymentReference>({
  refundId: s.optional(s.string()),
  _keysMap: {
    refundId: "refund_id",
  },
});
