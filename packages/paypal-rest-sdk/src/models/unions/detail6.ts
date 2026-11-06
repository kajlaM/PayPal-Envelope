import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { cannotProcessPaymentsSchema, type CannotProcessPayments } from "../cannot-process-payments.js";
import { invalidInvoiceTypeSchema, type InvalidInvoiceType } from "../invalid-invoice-type.js";
import {
  paymentAmountGreaterThanAmountDueSchema,
  type PaymentAmountGreaterThanAmountDue,
} from "../payment-amount-greater-than-amount-due.js";

export type Detail6 = PaymentAmountGreaterThanAmountDue | InvalidInvoiceType | CannotProcessPayments;

export const detail6Schema: Schema<Detail6> = s.of<Detail6>(
  s.union([
    s.lazy(() => paymentAmountGreaterThanAmountDueSchema),
    s.lazy(() => invalidInvoiceTypeSchema),
    s.lazy(() => cannotProcessPaymentsSchema),
  ]),
);
