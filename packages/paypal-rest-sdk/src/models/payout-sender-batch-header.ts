import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { recipientTypeSchema, type RecipientType } from "./recipient-type.js";

/** The sender-provided header for a payout request. */
export type PayoutSenderBatchHeader = {
  /**
   * The sender-specified ID number. Tracks the payout in an accounting
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
  /** The ID type that identifies the payment receiver. */
  recipientType?: RecipientType;
  /**
   * The subject line for the email that PayPal sends when payment for a payout item completes. The
   * subject line is the same for all recipients. Value is an alphanumeric string with a maximum
   * length of 255 single-byte characters.
   */
  emailSubject?: string;
  /**
   * The email message that PayPal sends when the payout item completes. The message is the same for
   * all recipients.
   */
  emailMessage?: string;
};

export const payoutSenderBatchHeaderSchema: Schema<PayoutSenderBatchHeader> =
  s.object<PayoutSenderBatchHeader>({
    senderBatchId: s.optional(s.string()),
    recipientType: s.optional(s.lazy(() => recipientTypeSchema)),
    emailSubject: s.optional(s.string()),
    emailMessage: s.optional(s.string()),
    _keysMap: {
      senderBatchId: "sender_batch_id",
      recipientType: "recipient_type",
      emailSubject: "email_subject",
      emailMessage: "email_message",
    },
  });
