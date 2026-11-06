import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { amountRangeSchema, type AmountRange } from "./amount-range.js";
import { dateAndTimeRangeSchema, type DateAndTimeRange } from "./date-and-time-range.js";
import { dateRangeSchema, type DateRange } from "./date-range.js";
import { invoiceStatusSchema, type InvoiceStatus } from "./invoice-status.js";

/** The invoice search parameters. */
export type SearchData = {
  /** Filters the search by the email address. */
  recipientEmail?: string;
  /** Filters the search by the recipient first name. */
  recipientFirstName?: string;
  /** Filters the search by the recipient last name. */
  recipientLastName?: string;
  /** Filters the search by the recipient business name. */
  recipientBusinessName?: string;
  /** Filters the search by the invoice number. */
  invoiceNumber?: string;
  /** An array of status values. */
  status?: InvoiceStatus[];
  /** The reference data. Includes a Purchase Order (PO) number. */
  reference?: string;
  /**
   * The [three-character ISO-4217 currency code](/api/rest/reference/currency-codes/) that
   * identifies the currency.
   */
  currencyCode?: string;
  /** A private bookkeeping memo for the user. */
  memo?: string;
  /** The amount range. */
  totalAmountRange?: AmountRange;
  /**
   * The date range. Filters invoices by creation date, invoice date, due date, and payment date.
   */
  invoiceDateRange?: DateRange;
  /**
   * The date range. Filters invoices by creation date, invoice date, due date, and payment date.
   */
  dueDateRange?: DateRange;
  /**
   * The date and time range. Filters invoices by creation date, invoice date, due date, and payment
   * date.
   */
  paymentDateRange?: DateAndTimeRange;
  /**
   * The date and time range. Filters invoices by creation date, invoice date, due date, and payment
   * date.
   */
  creationDateRange?: DateAndTimeRange;
  /**
   * Indicates whether to list merchant-archived invoices in the response. Value
   * is:<ul><li><code>true</code>. Response lists only merchant-archived
   * invoices.</li><li><code>false</code>. Response lists only unarchived
   * invoices.</li><li><code>null</code>. Response lists all invoices.</li></ul>
   */
  archived?: boolean;
  /**
   * A CSV file of fields to return for the user, if available. Because the invoice object can be
   * very large, field filtering is required. Valid collection fields are <code>items</code>,
   * <code>payments</code>, <code>refunds</code>, <code>additional_recipients_info</code>, and
   * <code>attachments</code>.
   */
  fields?: string[];
};

export const searchDataSchema: Schema<SearchData> = s.object<SearchData>({
  recipientEmail: s.optional(s.string()),
  recipientFirstName: s.optional(s.string()),
  recipientLastName: s.optional(s.string()),
  recipientBusinessName: s.optional(s.string()),
  invoiceNumber: s.optional(s.string()),
  status: s.optional(s.array(s.lazy(() => invoiceStatusSchema))),
  reference: s.optional(s.string()),
  currencyCode: s.optional(s.string()),
  memo: s.optional(s.string()),
  totalAmountRange: s.optional(s.lazy(() => amountRangeSchema)),
  invoiceDateRange: s.optional(s.lazy(() => dateRangeSchema)),
  dueDateRange: s.optional(s.lazy(() => dateRangeSchema)),
  paymentDateRange: s.optional(s.lazy(() => dateAndTimeRangeSchema)),
  creationDateRange: s.optional(s.lazy(() => dateAndTimeRangeSchema)),
  archived: s.optional(s.boolean()),
  fields: s.optional(s.array(s.string())),
  _keysMap: {
    recipientEmail: "recipient_email",
    recipientFirstName: "recipient_first_name",
    recipientLastName: "recipient_last_name",
    recipientBusinessName: "recipient_business_name",
    invoiceNumber: "invoice_number",
    currencyCode: "currency_code",
    totalAmountRange: "total_amount_range",
    invoiceDateRange: "invoice_date_range",
    dueDateRange: "due_date_range",
    paymentDateRange: "payment_date_range",
    creationDateRange: "creation_date_range",
  },
});
