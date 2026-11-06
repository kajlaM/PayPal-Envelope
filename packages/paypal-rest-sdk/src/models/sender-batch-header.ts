import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The sender-provided payout header for a payout request. */
export type SenderBatchHeader = {
  /**
   * A sender-specified ID number. Tracks the payout in an accounting
   * system.<blockquote><strong>Note:</strong> <p>PayPal does not process duplicate payouts. If you
   * specify a <code>sender_batch_id</code> that was used in the last 30 days, the API rejects the
   * request with an error message that shows the duplicate <code>sender_batch_id</code> and
   * includes a HATEOAS link to the original payout with the same
   * <code>sender_batch_id</code>.</p><p>If you receive an HTTP <code>5<i>nn</i></code> status code,
   * you can safely retry the request with the same <code>sender_batch_id</code>. The API completes
   * a payment only once for a <code>sender_batch_id</code> that is used within 30
   * days.</p></blockquote>
   */
  senderBatchId?: string;
  /** The ID type that identifies the recipient of the payment. For example, <code>EMAIL</code>. */
  recipientType?: string;
  /**
   * The subject line for the email that PayPal sends when payment for a payout item completes. The
   * subject line is the same for all recipients. Value is an alphanumeric string of up to 255
   * single-byte characters.
   */
  emailSubject?: string;
  /**
   * The email message that PayPal sends when the payout item completes. The message is the same for
   * all recipients.
   */
  emailMessage?: string;
  /**
   * The payouts and item-level notes are concatenated in the email. The maximum combined length of
   * the notes is 1000 characters.
   */
  note?: string;
};

export const senderBatchHeaderSchema: Schema<SenderBatchHeader> = s.object<SenderBatchHeader>({
  senderBatchId: s.optional(s.string()),
  recipientType: s.optional(s.string()),
  emailSubject: s.optional(s.string()),
  emailMessage: s.optional(s.string()),
  note: s.optional(s.string()),
  _keysMap: {
    senderBatchId: "sender_batch_id",
    recipientType: "recipient_type",
    emailSubject: "email_subject",
    emailMessage: "email_message",
  },
});
