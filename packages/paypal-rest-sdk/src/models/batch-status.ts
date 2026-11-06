import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The payouts status. */
export const BatchStatus = {
  Denied: "DENIED",
  Pending: "PENDING",
  Processing: "PROCESSING",
  Success: "SUCCESS",
  Canceled: "CANCELED",
} as const;
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus] | (string & {});

export const batchStatusSchema: EnumSchema<BatchStatus> = s.enumOf<BatchStatus>(BatchStatus);
