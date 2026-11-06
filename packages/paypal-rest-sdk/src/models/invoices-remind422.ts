import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { cannotRemindInvoiceSchema, type CannotRemindInvoice } from "./cannot-remind-invoice.js";

export type InvoicesRemind422 = {
  details?: CannotRemindInvoice[];
};

export const invoicesRemind422Schema: Schema<InvoicesRemind422> = s.object<InvoicesRemind422>({
  details: s.optional(s.array(s.lazy(() => cannotRemindInvoiceSchema))),
});
