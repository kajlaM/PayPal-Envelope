import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The status of the invoice. */
export const InvoiceStatus = {
  Draft: "DRAFT",
  Sent: "SENT",
  Scheduled: "SCHEDULED",
  Paid: "PAID",
  MarkedAsPaid: "MARKED_AS_PAID",
  Cancelled: "CANCELLED",
  Refunded: "REFUNDED",
  PartiallyPaid: "PARTIALLY_PAID",
  PartiallyRefunded: "PARTIALLY_REFUNDED",
  MarkedAsRefunded: "MARKED_AS_REFUNDED",
  Unpaid: "UNPAID",
  PaymentPending: "PAYMENT_PENDING",
  AutoCancelled: "AUTO_CANCELLED",
  PaidExternal: "PAID_EXTERNAL",
  RefundedExternal: "REFUNDED_EXTERNAL",
  Shared: "SHARED",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus] | (string & {});

export const invoiceStatusSchema: EnumSchema<InvoiceStatus> = s.enumOf<InvoiceStatus>(InvoiceStatus);
