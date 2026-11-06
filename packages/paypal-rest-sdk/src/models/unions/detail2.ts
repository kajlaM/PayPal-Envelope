import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import {
  cannotCancelDraftInvoiceSchema,
  type CannotCancelDraftInvoice,
} from "../cannot-cancel-draft-invoice.js";
import {
  cannotCancelPaidInvoiceSchema,
  type CannotCancelPaidInvoice,
} from "../cannot-cancel-paid-invoice.js";
import {
  cannotCancelRefundedInvoiceSchema,
  type CannotCancelRefundedInvoice,
} from "../cannot-cancel-refunded-invoice.js";
import {
  cannotCancelScheduledInvoiceSchema,
  type CannotCancelScheduledInvoice,
} from "../cannot-cancel-scheduled-invoice.js";
import { invoiceCanceledAlreadySchema, type InvoiceCanceledAlready } from "../invoice-canceled-already.js";

export type Detail2 =
  | CannotCancelDraftInvoice
  | CannotCancelPaidInvoice
  | CannotCancelRefundedInvoice
  | CannotCancelScheduledInvoice
  | InvoiceCanceledAlready;

export const detail2Schema: Schema<Detail2> = s.of<Detail2>(
  s.union([
    s.lazy(() => cannotCancelDraftInvoiceSchema),
    s.lazy(() => cannotCancelPaidInvoiceSchema),
    s.lazy(() => cannotCancelRefundedInvoiceSchema),
    s.lazy(() => cannotCancelScheduledInvoiceSchema),
    s.lazy(() => invoiceCanceledAlreadySchema),
  ]),
);
