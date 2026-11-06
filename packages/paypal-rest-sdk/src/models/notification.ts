import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The email or SMS notification to send to the invoicer or payer on sending an invoice. */
export type Notification = {
  /**
   * The subject of the email that is sent as a notification to the
   * recipient.<blockquote><strong>Note:</strong> User-provided values for this field will not be
   * honored and the subject will always be defaulted to a system-defined value.</blockquote>
   */
  subject?: string;
  /**
   * A note to the payer.<blockquote><strong>Note:</strong> User-provided values for this field will
   * not be honored and the note will always be defaulted to a system-defined value.</blockquote>
   */
  note?: string;
  /** Indicates whether to send a copy of the email to the merchant. @default false */
  sendToInvoicer?: boolean;
  /** Indicates whether to send a copy of the email to the recipient. @default true */
  sendToRecipient?: boolean;
  /**
   * An array of one or more CC: emails to which notifications are sent. If you omit this parameter,
   * a notification is sent to all CC: email addresses that are part of the
   * invoice.<blockquote><strong>Note:</strong> Valid values are email addresses in the
   * `additional_recipients` value associated with the invoice.</blockquote>
   */
  additionalRecipients?: string[];
};

export const notificationSchema: Schema<Notification> = s.object<Notification>({
  subject: s.optional(s.string()),
  note: s.optional(s.string()),
  sendToInvoicer: s.defaulted(s.boolean(), false),
  sendToRecipient: s.defaulted(s.boolean(), true),
  additionalRecipients: s.optional(s.array(s.string())),
  _keysMap: {
    sendToInvoicer: "send_to_invoicer",
    sendToRecipient: "send_to_recipient",
    additionalRecipients: "additional_recipients",
  },
});
