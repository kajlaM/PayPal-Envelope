import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** Metadata for Venmo transactions. */
export type ApplicationContext = {
  /**
   * This attribute controls the privacy of a payout transaction in recipient’s feed. PUBLIC,
   * FRIENDS_ONLY & PRIVATE are the values that can be used. PUBLIC - The payment displays on the
   * recipient's public Venmo feed. FRIENDS_ONLY - The payment displays only to the recipient's
   * Venmo friends. PRIVATE - The payment displays only on the recipient's personal feed. Defaults
   * to `PRIVATE` if left blank.
   *
   * @default "PRIVATE"
   */
  socialFeedPrivacy?: string;
  /**
   * Link to a Holler sticker. For Venmo recipients, the sticker displays with the payout message.
   * The maximum URL length is 151.
   *
   * @deprecated
   */
  hollerUrl?: string;
  /**
   * Link to a logo that displays as the sender's profile image in the recipient's Venmo feed. Used
   * to add or update the business profile image. Max image size: 1024 x 1024 pixels. The image
   * should be square and maximum URL length is 2000.
   */
  logoUrl?: string;
};

export const applicationContextSchema: Schema<ApplicationContext> = s.object<ApplicationContext>({
  socialFeedPrivacy: s.defaulted(s.string(), "PRIVATE"),
  hollerUrl: s.optional(s.string()),
  logoUrl: s.optional(s.string()),
  _keysMap: {
    socialFeedPrivacy: "social_feed_privacy",
    hollerUrl: "holler_url",
    logoUrl: "logo_url",
  },
});
