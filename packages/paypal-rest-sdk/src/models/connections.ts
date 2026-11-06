import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { lastSyncStatusSchema, type LastSyncStatus } from "./last-sync-status.js";

/** This lists last sync status and connection platform name. */
export type Connections = {
  /**
   * The name of the platform. This property supports Unicode. The pattern is not provided because
   * the value is defined by an external party.
   */
  platformName?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  lastSyncTime?: string;
  /** The status of the last sync. This property supports Unicode. */
  lastSyncStatus?: LastSyncStatus;
};

export const connectionsSchema: Schema<Connections> = s.object<Connections>({
  platformName: s.optional(s.string()),
  lastSyncTime: s.optional(s.string()),
  lastSyncStatus: s.optional(s.lazy(() => lastSyncStatusSchema)),
  _keysMap: {
    platformName: "platform_name",
    lastSyncTime: "last_sync_time",
    lastSyncStatus: "last_sync_status",
  },
});
