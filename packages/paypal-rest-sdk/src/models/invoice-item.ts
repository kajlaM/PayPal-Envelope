import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { discountSchema, type Discount } from "./discount.js";
import { moneySchema, type Money } from "./money.js";
import { taxSchema, type Tax } from "./tax.js";
import { unitOfMeasureSchema, type UnitOfMeasure } from "./unit-of-measure.js";

/** An array of invoice line item information. The maximum items for an invoice is `100`. */
export type InvoiceItem = {
  /** The ID of the invoice line item. */
  id?: string;
  /** The item name for the invoice line item. */
  name?: string;
  /** The item description for the invoice line item. */
  description?: string;
  /**
   * The quantity of the item that the invoicer provides to the payer. Value is from `-1000000` to
   * `1000000`. Supports up to five decimal places.
   */
  quantity?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  unitAmount?: Money;
  /**
   * The tax information. Includes the tax name and tax rate of invoice items. The tax amount is
   * added to the item total.
   */
  tax?: Tax;
  /**
   * The stand-alone date, in [Internet date and time
   * format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values,
   * such as a date of birth, you should use dates with no associated time or time-zone data.
   * Whenever possible, use the standard `date_time` type. This regular expression does not validate
   * all dates. For example, February 31 is valid and nothing is known about leap years.
   */
  itemDate?: string;
  /**
   * The discount as a percent or amount at invoice level. The invoice discount amount is subtracted
   * from the item total.
   */
  discount?: Discount;
  /** The unit of measure for the invoiced item. */
  unitOfMeasure?: UnitOfMeasure;
};

export const invoiceItemSchema: Schema<InvoiceItem> = s.object<InvoiceItem>({
  id: s.optional(s.string()),
  name: s.optional(s.string()),
  description: s.optional(s.string()),
  quantity: s.optional(s.string()),
  unitAmount: s.optional(s.lazy(() => moneySchema)),
  tax: s.optional(s.lazy(() => taxSchema)),
  itemDate: s.optional(s.string()),
  discount: s.optional(s.lazy(() => discountSchema)),
  unitOfMeasure: s.optional(s.lazy(() => unitOfMeasureSchema)),
  _keysMap: {
    unitAmount: "unit_amount",
    itemDate: "item_date",
    unitOfMeasure: "unit_of_measure",
  },
});
