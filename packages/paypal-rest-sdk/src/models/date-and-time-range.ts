import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/**
 * The date and time range. Filters invoices by creation date, invoice date, due date, and payment
 * date.
 */
export type DateAndTimeRange = {
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  start?: string;
  /**
   * The date and time, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional
   * seconds are optional.<blockquote><strong>Note:</strong> The regular expression provides
   * guidance but does not reject all invalid dates.</blockquote>
   */
  end?: string;
};

export const dateAndTimeRangeSchema: Schema<DateAndTimeRange> = s.object<DateAndTimeRange>({
  start: s.optional(s.string()),
  end: s.optional(s.string()),
});
