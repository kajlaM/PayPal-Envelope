import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { invoiceAmountSummarySchema, type InvoiceAmountSummary } from "./invoice-amount-summary.js";
import { invoiceItemSchema, type InvoiceItem } from "./invoice-item.js";
import { invoicerInformationSchema, type InvoicerInformation } from "./invoicer-information.js";
import { moneySchema, type Money } from "./money.js";
import { recipientInformationSchema, type RecipientInformation } from "./recipient-information.js";
import { templateConfigurationSchema, type TemplateConfiguration } from "./template-configuration.js";
import { templateDetailSchema, type TemplateDetail } from "./template-detail.js";

/**
 * The template details. Includes invoicer business information, invoice recipients, items, and
 * configuration.
 */
export type TemplateInformation = {
  /** The template-related details. Includes notes, terms and conditions, memo, and attachments. */
  detail?: TemplateDetail;
  /** The invoicer business information that appears on the invoice. */
  invoicer?: InvoicerInformation;
  /** The billing and shipping information. Includes name, email, address, phone, and language. */
  primaryRecipients?: RecipientInformation[];
  /**
   * An array of one or more CC: emails to which notifications are sent. If you omit this parameter,
   * a notification is sent to all CC: email addresses that are part of the
   * invoice.<blockquote><strong>Note:</strong> Valid values are email addresses in the
   * `additional_recipients` value associated with the invoice.</blockquote>
   */
  additionalRecipients?: string[];
  /** An array of invoice line-item information. */
  items?: InvoiceItem[];
  /** The template configuration details. Includes tax information, tip, and partial payment. */
  configuration?: TemplateConfiguration;
  /** The invoice amount summary of item total, discount, tax total, and shipping. */
  amount?: InvoiceAmountSummary;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  dueAmount?: Money;
};

export const templateInformationSchema: Schema<TemplateInformation> = s.object<TemplateInformation>({
  detail: s.optional(s.lazy(() => templateDetailSchema)),
  invoicer: s.optional(s.lazy(() => invoicerInformationSchema)),
  primaryRecipients: s.optional(s.array(s.lazy(() => recipientInformationSchema))),
  additionalRecipients: s.optional(s.array(s.string())),
  items: s.optional(s.array(s.lazy(() => invoiceItemSchema))),
  configuration: s.optional(s.lazy(() => templateConfigurationSchema)),
  amount: s.optional(s.lazy(() => invoiceAmountSummarySchema)),
  dueAmount: s.optional(s.lazy(() => moneySchema)),
  _keysMap: {
    primaryRecipients: "primary_recipients",
    additionalRecipients: "additional_recipients",
    dueAmount: "due_amount",
  },
});
