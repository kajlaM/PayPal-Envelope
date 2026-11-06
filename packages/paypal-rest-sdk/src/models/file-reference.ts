import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The file reference. Can be a file in PayPal MediaServ, PayPal DMS, or other custom store. */
export type FileReference = {
  /** The ID of the referenced file. */
  id?: string;
  /** The reference URL for the file. */
  referenceUrl?: string;
  /**
   * The [Internet Assigned Numbers Authority (IANA) media type of the
   * file](https://www.iana.org/assignments/media-types/media-types.xhtml).
   */
  contentType?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  createTime?: string;
  /** The size of the file, in bytes. */
  size?: string;
};

export const fileReferenceSchema: Schema<FileReference> = s.object<FileReference>({
  id: s.optional(s.string()),
  referenceUrl: s.optional(s.string()),
  contentType: s.optional(s.string()),
  createTime: s.optional(s.string()),
  size: s.optional(s.string()),
  _keysMap: {
    referenceUrl: "reference_url",
    contentType: "content_type",
    createTime: "create_time",
  },
});
