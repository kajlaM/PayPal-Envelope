import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { fileReferenceSchema, type FileReference } from "./file-reference.js";
import { paymentTermSchema, type PaymentTerm } from "./payment-term.js";
import { templateMetadataSchema, type TemplateMetadata } from "./template-metadata.js";

/** The template-related details. Includes notes, terms and conditions, memo, and attachments. */
export type TemplateDetail = {
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
   * The payment term of the invoice. Payment can be due upon receipt, a specified date, or in a set
   * number of days.
   */
  paymentTerm?: PaymentTerm;
  /** The audit metadata. Captures all template actions on create and update. */
  metadata?: TemplateMetadata;
};

export const templateDetailSchema: Schema<TemplateDetail> = s.object<TemplateDetail>({
  reference: s.optional(s.string()),
  currencyCode: s.optional(s.string()),
  note: s.optional(s.string()),
  termsAndConditions: s.optional(s.string()),
  memo: s.optional(s.string()),
  attachments: s.optional(s.array(s.lazy(() => fileReferenceSchema))),
  paymentTerm: s.optional(s.lazy(() => paymentTermSchema)),
  metadata: s.optional(s.lazy(() => templateMetadataSchema)),
  _keysMap: {
    currencyCode: "currency_code",
    termsAndConditions: "terms_and_conditions",
    paymentTerm: "payment_term",
  },
});
