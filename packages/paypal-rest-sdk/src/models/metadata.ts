import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { invoiceCreationFlowSchema, type InvoiceCreationFlow } from "./invoice-creation-flow.js";

/** The audit metadata. Captures all invoicing actions on create, send, update, and cancel. */
export type Metadata = {
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  createTime?: string;
  /** The email address of the account that created the resource. */
  createdBy?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  lastUpdateTime?: string;
  /** The email address of the account that last edited the resource. */
  lastUpdatedBy?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  cancelTime?: string;
  /** The actor who canceled the resource. */
  cancelledBy?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  firstSentTime?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  lastSentTime?: string;
  /** The email address of the account that last sent the resource. */
  lastSentBy?: string;
  /**
   * The frequency at which the invoice is sent:<ul><li>Multiple recipient. Sent to multiple
   * recipients.</li><li>Batch. Sent in a batch.</li><li>Regular single. Sent one time to a single
   * recipient.</li></ul>
   */
  createdByFlow?: InvoiceCreationFlow;
  /** The URL for the invoice payer view hosted on paypal.com. */
  recipientViewUrl?: string;
  /** The URL for the invoice merchant view hosted on paypal.com. */
  invoicerViewUrl?: string;
};

export const metadataSchema: Schema<Metadata> = s.object<Metadata>({
  createTime: s.optional(s.string()),
  createdBy: s.optional(s.string()),
  lastUpdateTime: s.optional(s.string()),
  lastUpdatedBy: s.optional(s.string()),
  cancelTime: s.optional(s.string()),
  cancelledBy: s.optional(s.string()),
  firstSentTime: s.optional(s.string()),
  lastSentTime: s.optional(s.string()),
  lastSentBy: s.optional(s.string()),
  createdByFlow: s.optional(s.lazy(() => invoiceCreationFlowSchema)),
  recipientViewUrl: s.optional(s.string()),
  invoicerViewUrl: s.optional(s.string()),
  _keysMap: {
    createTime: "create_time",
    createdBy: "created_by",
    lastUpdateTime: "last_update_time",
    lastUpdatedBy: "last_updated_by",
    cancelTime: "cancel_time",
    cancelledBy: "cancelled_by",
    firstSentTime: "first_sent_time",
    lastSentTime: "last_sent_time",
    lastSentBy: "last_sent_by",
    createdByFlow: "created_by_flow",
    recipientViewUrl: "recipient_view_url",
    invoicerViewUrl: "invoicer_view_url",
  },
});
