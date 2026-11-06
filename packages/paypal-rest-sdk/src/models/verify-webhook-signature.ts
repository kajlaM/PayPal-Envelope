import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { eventSchema, type Event } from "./event.js";

/** A verify webhook signature request. */
export type VerifyWebhookSignature = {
  /**
   * The algorithm that PayPal uses to generate the signature and that you can use to verify the
   * signature. Extract this value from the `PAYPAL-AUTH-ALGO` response header, which is received
   * with the webhook notification.
   */
  authAlgo?: string;
  /**
   * The X.509 public key certificate. Download the certificate from this URL and use it to verify
   * the signature. Extract this value from the `PAYPAL-CERT-URL` response header, which is received
   * with the webhook notification.
   */
  certUrl?: string;
  /**
   * The ID of the HTTP transmission. Contained in the `PAYPAL-TRANSMISSION-ID` header of the
   * notification message.
   */
  transmissionId?: string;
  /**
   * The PayPal-generated asymmetric signature. Appears in the `PAYPAL-TRANSMISSION-SIG` header of
   * the notification message.
   */
  transmissionSig?: string;
  /**
   * The date and time of the HTTP transmission, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Appears in the
   * `PAYPAL-TRANSMISSION-TIME` header of the notification message.
   */
  transmissionTime?: Date;
  /** The ID of the webhook as configured in your Developer Portal account. */
  webhookId?: string;
  /** A webhook event notification. */
  webhookEvent?: Event;
};

export const verifyWebhookSignatureSchema: Schema<VerifyWebhookSignature> = s.object<VerifyWebhookSignature>({
  authAlgo: s.optional(s.string()),
  certUrl: s.optional(s.string()),
  transmissionId: s.optional(s.string()),
  transmissionSig: s.optional(s.string()),
  transmissionTime: s.optional(s.dateTime()),
  webhookId: s.optional(s.string()),
  webhookEvent: s.optional(s.lazy(() => eventSchema)),
  _keysMap: {
    authAlgo: "auth_algo",
    certUrl: "cert_url",
    transmissionId: "transmission_id",
    transmissionSig: "transmission_sig",
    transmissionTime: "transmission_time",
    webhookId: "webhook_id",
    webhookEvent: "webhook_event",
  },
});
