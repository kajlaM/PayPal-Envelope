import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  cannotDeleteExternalPaymentSchema,
  type CannotDeleteExternalPayment,
} from "./cannot-delete-external-payment.js";

export type InvoicesPaymentsDelete422 = {
  details?: CannotDeleteExternalPayment[];
};

export const invoicesPaymentsDelete422Schema: Schema<InvoicesPaymentsDelete422> =
  s.object<InvoicesPaymentsDelete422>({
    details: s.optional(s.array(s.lazy(() => cannotDeleteExternalPaymentSchema))),
  });
