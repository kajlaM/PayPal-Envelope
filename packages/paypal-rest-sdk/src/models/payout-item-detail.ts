import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { currencySchema, type Currency } from "./currency.js";
import { nameSchema, type Name } from "./name.js";
import { purposeSchema, type Purpose } from "./purpose.js";
import { recipientTypeSchema, type RecipientType } from "./recipient-type.js";
import { RecipientWallet, recipientWalletSchema } from "./recipient-wallet.js";

/** The details for a sender-created payout to a single recipient. */
export type PayoutItemDetail = {
  /** The ID type that identifies the payment receiver. */
  recipientType?: RecipientType;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Currency;
  /**
   * The sender-specified note for notifications. Supports up to 4000 ASCII characters and 1000
   * non-ASCII characters.
   */
  note?: string;
  /** The receiver of the payment. Corresponds to the `recipient_type` value in the request. */
  receiver?: string;
  /** A sender-specified ID number. Tracks the payout in an accounting system. */
  senderItemId?: string;
  /** The name of the party. */
  recipientName?: Name;
  /**
   * The wallet where the recipient receives the payout. Payouts to Venmo recipients require a
   * 'note' string and a US mobile phone number.
   *
   * @default RecipientWallet.Paypal
   */
  recipientWallet?: RecipientWallet;
  /** The purpose of the transaction. */
  purpose?: Purpose;
};

export const payoutItemDetailSchema: Schema<PayoutItemDetail> = s.object<PayoutItemDetail>({
  recipientType: s.optional(s.lazy(() => recipientTypeSchema)),
  amount: s.optional(s.lazy(() => currencySchema)),
  note: s.optional(s.string()),
  receiver: s.optional(s.string()),
  senderItemId: s.optional(s.string()),
  recipientName: s.optional(s.lazy(() => nameSchema)),
  recipientWallet: s.defaulted(recipientWalletSchema, RecipientWallet.Paypal),
  purpose: s.optional(s.lazy(() => purposeSchema)),
  _keysMap: {
    recipientType: "recipient_type",
    senderItemId: "sender_item_id",
    recipientName: "recipient_name",
    recipientWallet: "recipient_wallet",
  },
});
