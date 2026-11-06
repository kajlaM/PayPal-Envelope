import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  alternateNotificationMethodSchema,
  type AlternateNotificationMethod,
} from "./alternate-notification-method.js";
import { applicationContextSchema, type ApplicationContext } from "./application-context.js";
import { currencySchema, type Currency } from "./currency.js";
import { purposeSchema, type Purpose } from "./purpose.js";

/** The sender-created payout to a recipient. */
export type PayoutItem = {
  /**
   * The recipient type. Value is:<ul><li><p><code>EMAIL</code>. The unencrypted email. Value is a
   * string of up to 127 single-byte characters.</p></li><li><p><code>PHONE</code>. The unencrypted
   * phone number.</p><blockquote><strong>Note:</strong> The PayPal sandbox does not support the
   * <code>PHONE</code> recipient type.</blockquote></li><li><p><code>PAYPAL_ID</code>. The
   * encrypted PayPal account number.</p></li><li><p><code>USER_HANDLE</code>. User handle (or)
   * Username associated with Venmo account.</p></li></ul><br/>If the
   * <code>sender_batch_header</code> includes the <code>recipient_type</code> attribute, payout
   * items use the <code>recipient_type</code> of the <code>sender_batch_header</code>, unless a
   * payout item has its own <code>recipient_type</code> attribute. If the
   * <code>sender_batch_header</code> omits the <code>recipient_type</code> attribute, each payout
   * item must include its own <code>recipient_type</code> value.
   */
  recipientType?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Currency;
  /**
   * The sender-specified note for notifications. Supports up to 4000 ASCII characters and 1000
   * non-ASCII characters.
   */
  note?: string;
  /**
   * The receiver of the payment. Corresponds to the `recipient_type` value in the request. Max
   * value of up to 127 single-byte characters.
   */
  receiver?: string;
  /** The sender-specified ID number. Tracks the payout in an accounting system. */
  senderItemId?: string;
  /** The recipient wallet. @default "PAYPAL" */
  recipientWallet?: string;
  /** Captures additional notification modes to reach out to the receiver regarding this payment. */
  alternateNotificationMethod?: AlternateNotificationMethod;
  /**
   * The [language tag](https://tools.ietf.org/html/bcp47#section-2) for the language in which to
   * localize the error-related strings, such as messages, issues, and suggested actions. The tag is
   * made up of the [ISO 639-2 language
   * code](https://www.loc.gov/standards/iso639-2/php/code_list.php), the optional [ISO-15924 script
   * tag](https://www.unicode.org/iso15924/codelists.html), and the [ISO-3166 alpha-2 country
   * code](/docs/integration/direct/rest/country-codes/).
   */
  notificationLanguage?: string;
  /** Metadata for Venmo transactions. */
  applicationContext?: ApplicationContext;
  /** The purpose of the transaction. */
  purpose?: Purpose;
};

export const payoutItemSchema: Schema<PayoutItem> = s.object<PayoutItem>({
  recipientType: s.optional(s.string()),
  amount: s.optional(s.lazy(() => currencySchema)),
  note: s.optional(s.string()),
  receiver: s.optional(s.string()),
  senderItemId: s.optional(s.string()),
  recipientWallet: s.defaulted(s.string(), "PAYPAL"),
  alternateNotificationMethod: s.optional(s.lazy(() => alternateNotificationMethodSchema)),
  notificationLanguage: s.optional(s.string()),
  applicationContext: s.optional(s.lazy(() => applicationContextSchema)),
  purpose: s.optional(s.lazy(() => purposeSchema)),
  _keysMap: {
    recipientType: "recipient_type",
    senderItemId: "sender_item_id",
    recipientWallet: "recipient_wallet",
    alternateNotificationMethod: "alternate_notification_method",
    notificationLanguage: "notification_language",
    applicationContext: "application_context",
  },
});
