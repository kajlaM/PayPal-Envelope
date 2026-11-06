import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { configurationSchema, type Configuration } from "./configuration.js";
import { invoiceAmountSummarySchema, type InvoiceAmountSummary } from "./invoice-amount-summary.js";
import { invoiceDetail1Schema, type InvoiceDetail1 } from "./invoice-detail1.js";
import { invoiceItemSchema, type InvoiceItem } from "./invoice-item.js";
import { invoiceStatusSchema, type InvoiceStatus } from "./invoice-status.js";
import { invoicerInformationSchema, type InvoicerInformation } from "./invoicer-information.js";
import { linkDescription1Schema, type LinkDescription1 } from "./link-description1.js";
import { moneySchema, type Money } from "./money.js";
import { paymentsSchema, type Payments } from "./payments.js";
import { recipientInformationSchema, type RecipientInformation } from "./recipient-information.js";
import { refundsSchema, type Refunds } from "./refunds.js";

/**
 * The invoice details which includes all information of the invoice like items, billing
 * information.
 */
export type Invoice = {
  /** The ID of the invoice. */
  id?: string;
  /** The parent ID to an invoice that defines the group invoice to which the invoice is related. */
  parentId?: string;
  /** The status of the invoice. */
  status?: InvoiceStatus;
  /**
   * The details of the invoice. Includes invoice number, date, payment terms, and audit metadata.
   */
  detail?: InvoiceDetail1;
  /** The invoicer business information that appears on the invoice. */
  invoicer?: InvoicerInformation;
  /** The billing and shipping information. Includes name, email, address, phone and language. */
  primaryRecipients?: RecipientInformation[];
  /**
   * An array of one or more CC: emails to which notifications are sent. If you omit this parameter,
   * a notification is sent to all CC: email addresses that are part of the
   * invoice.<blockquote><strong>Note:</strong> Valid values are email addresses in the
   * `additional_recipients` value associated with the invoice.</blockquote>
   */
  additionalRecipients?: string[];
  /** An array of invoice line item information. */
  items?: InvoiceItem[];
  /**
   * The invoice configuration details. Includes partial payment, tip, and tax calculated after
   * discount.
   */
  configuration?: Configuration;
  /** The invoice amount summary of item total, discount, tax total, and shipping. */
  amount?: InvoiceAmountSummary;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  dueAmount?: Money;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  gratuity?: Money;
  /** An array of payments registered against the invoice. */
  payments?: Payments;
  /** The invoicing refund details. Includes the refund type, date, amount, and method. */
  refunds?: Refunds;
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescription1[];
};

export const invoiceSchema: Schema<Invoice> = s.object<Invoice>({
  id: s.optional(s.string()),
  parentId: s.optional(s.string()),
  status: s.optional(s.lazy(() => invoiceStatusSchema)),
  detail: s.optional(s.lazy(() => invoiceDetail1Schema)),
  invoicer: s.optional(s.lazy(() => invoicerInformationSchema)),
  primaryRecipients: s.optional(s.array(s.lazy(() => recipientInformationSchema))),
  additionalRecipients: s.optional(s.array(s.string())),
  items: s.optional(s.array(s.lazy(() => invoiceItemSchema))),
  configuration: s.optional(s.lazy(() => configurationSchema)),
  amount: s.optional(s.lazy(() => invoiceAmountSummarySchema)),
  dueAmount: s.optional(s.lazy(() => moneySchema)),
  gratuity: s.optional(s.lazy(() => moneySchema)),
  payments: s.optional(s.lazy(() => paymentsSchema)),
  refunds: s.optional(s.lazy(() => refundsSchema)),
  links: s.optional(s.array(s.lazy(() => linkDescription1Schema))),
  _keysMap: {
    parentId: "parent_id",
    primaryRecipients: "primary_recipients",
    additionalRecipients: "additional_recipients",
    dueAmount: "due_amount",
  },
});
