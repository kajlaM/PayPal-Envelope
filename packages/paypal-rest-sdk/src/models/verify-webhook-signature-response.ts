import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { verificationStatusSchema, type VerificationStatus } from "./verification-status.js";

/** The verify webhook signature response. */
export type VerifyWebhookSignatureResponse = {
  /** The status of the signature verification. */
  verificationStatus?: VerificationStatus;
};

export const verifyWebhookSignatureResponseSchema: Schema<VerifyWebhookSignatureResponse> =
  s.object<VerifyWebhookSignatureResponse>({
    verificationStatus: s.optional(s.lazy(() => verificationStatusSchema)),
    _keysMap: {
      verificationStatus: "verification_status",
    },
  });
