import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { fileReferenceSchema, type FileReference } from "./file-reference.js";
import { invoicePaymentTermSchema, type InvoicePaymentTerm } from "./invoice-payment-term.js";
import { metadataSchema, type Metadata } from "./metadata.js";

/** The details of the invoice. Includes invoice number, date, payment terms, and audit metadata. */
export type InvoiceDetail1 = {
  /** The reference data. Includes a Purchase Order (PO) number. */
  reference?: string;
  /**
   * The [three-character ISO-4217 currency code](/api/rest/reference/currency-codes/) that
   * identifies the currency.
   */
  currencyCode?: string;
  /** A note to the invoice recipient. Also appears on the invoice notification email. */
  note?: string;
  /**
   * The general terms of the invoice. Can include return or cancellation policy and other terms and
   * conditions.
   */
  termsAndConditions?: string;
  /** A private bookkeeping memo for the user. */
  memo?: string;
  /** An array of PayPal IDs for the files that are attached to an invoice. */
  attachments?: FileReference[];
  /**
   * The invoice number. Default is the number that is auto-incremented number from the last number.
   */
  invoiceNumber?: string;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  invoiceDate?: string;
  /**
   * The payment term of the invoice. Payment can be due upon receipt, a specified date, or in a set
   * number of days.
   */
  paymentTerm?: InvoicePaymentTerm;
  /** The audit metadata. Captures all invoicing actions on create, send, update, and cancel. */
  metadata?: Metadata;
};

export const invoiceDetail1Schema: Schema<InvoiceDetail1> = s.object<InvoiceDetail1>({
  reference: s.optional(s.string()),
  currencyCode: s.optional(s.string()),
  note: s.optional(s.string()),
  termsAndConditions: s.optional(s.string()),
  memo: s.optional(s.string()),
  attachments: s.optional(s.array(s.lazy(() => fileReferenceSchema))),
  invoiceNumber: s.optional(s.string()),
  invoiceDate: s.optional(s.string()),
  paymentTerm: s.optional(s.lazy(() => invoicePaymentTermSchema)),
  metadata: s.optional(s.lazy(() => metadataSchema)),
  _keysMap: {
    currencyCode: "currency_code",
    termsAndConditions: "terms_and_conditions",
    invoiceNumber: "invoice_number",
    invoiceDate: "invoice_date",
    paymentTerm: "payment_term",
  },
});
