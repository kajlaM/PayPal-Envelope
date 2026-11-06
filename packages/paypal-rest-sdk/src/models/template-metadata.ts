import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The audit metadata. Captures all template actions on create and update. */
export type TemplateMetadata = {
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  createTime?: string;
  /** The email address of the account that created the resource. */
  createdBy?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  lastUpdateTime?: string;
  /** The email address of the account that last edited the resource. */
  lastUpdatedBy?: string;
};

export const templateMetadataSchema: Schema<TemplateMetadata> = s.object<TemplateMetadata>({
  createTime: s.optional(s.string()),
  createdBy: s.optional(s.string()),
  lastUpdateTime: s.optional(s.string()),
  lastUpdatedBy: s.optional(s.string()),
  _keysMap: {
    createTime: "create_time",
    createdBy: "created_by",
    lastUpdateTime: "last_update_time",
    lastUpdatedBy: "last_updated_by",
  },
});
