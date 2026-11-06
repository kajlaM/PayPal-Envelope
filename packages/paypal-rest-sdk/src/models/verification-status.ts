import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The status of the signature verification. */
export const VerificationStatus = {
  Success: "SUCCESS",
  Failure: "FAILURE",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus] | (string & {});

export const verificationStatusSchema: EnumSchema<VerificationStatus> =
  s.enumOf<VerificationStatus>(VerificationStatus);
