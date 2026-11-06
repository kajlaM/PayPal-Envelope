import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The date range. Filters invoices by creation date, invoice date, due date, and payment date. */
export type DateRange = {
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  start?: string;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  end?: string;
};

export const dateRangeSchema: Schema<DateRange> = s.object<DateRange>({
  start: s.optional(s.string()),
  end: s.optional(s.string()),
});
