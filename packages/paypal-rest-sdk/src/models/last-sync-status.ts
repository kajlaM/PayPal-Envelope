import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The status of the last sync. This property supports Unicode. */
export const LastSyncStatus = {
  InProgress: "IN_PROGRESS",
  Success: "SUCCESS",
  Failed: "FAILED",
} as const;
export type LastSyncStatus = (typeof LastSyncStatus)[keyof typeof LastSyncStatus] | (string & {});

export const lastSyncStatusSchema: EnumSchema<LastSyncStatus> = s.enumOf<LastSyncStatus>(LastSyncStatus);
