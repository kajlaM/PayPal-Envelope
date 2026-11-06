import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The wallet where the recipient receives the payout. Payouts to Venmo recipients require a 'note'
 * string and a US mobile phone number.
 */
export const RecipientWallet = {
  Paypal: "PAYPAL",
  Venmo: "VENMO",
} as const;
export type RecipientWallet = (typeof RecipientWallet)[keyof typeof RecipientWallet] | (string & {});

export const recipientWalletSchema: EnumSchema<RecipientWallet> = s.enumOf<RecipientWallet>(RecipientWallet);
