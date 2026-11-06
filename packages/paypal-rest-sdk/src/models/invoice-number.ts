import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The invoice number. */
export type InvoiceNumber = {
  /**
   * The invoice number. If you omit this value, the default is the auto-incremented number from the
   * last number.
   */
  invoiceNumber?: string;
  /** Resource Id. */
  invoiceId?: string;
};

export const invoiceNumberSchema: Schema<InvoiceNumber> = s.object<InvoiceNumber>({
  invoiceNumber: s.optional(s.string()),
  invoiceId: s.optional(s.string()),
  _keysMap: {
    invoiceNumber: "invoice_number",
    invoiceId: "invoice_id",
  },
});
