import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { invoiceSchema, type Invoice } from "./invoice.js";
import { linkDescription1Schema, type LinkDescription1 } from "./link-description1.js";

/**
 * An array of merchant invoices. Includes the total invoices count and [HATEOAS
 * links](/docs/api/reference/api-responses/#hateoas-links) for navigation.
 */
export type Invoices = {
  /**
   * The total number of pages that are available for the search criteria.
   * <blockquote><strong>Note:</strong> Clients MUST NOT assume that the value of total_pages is
   * constant. The value MAY change from one request to the next</blockquote>
   */
  totalPages?: number;
  /**
   * The total number of invoices that match the search criteria.<blockquote><strong>Note:</strong>
   * Clients MUST NOT assume that the value of <code>total_items</code> is constant. The value MAY
   * change from one request to the next.</blockquote>
   */
  totalItems?: number;
  /** The list of invoices that match the search criteria. */
  items?: Invoice[];
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescription1[];
};

export const invoicesSchema: Schema<Invoices> = s.object<Invoices>({
  totalPages: s.optional(s.int()),
  totalItems: s.optional(s.int()),
  items: s.optional(s.array(s.lazy(() => invoiceSchema))),
  links: s.optional(s.array(s.lazy(() => linkDescription1Schema))),
  _keysMap: {
    totalPages: "total_pages",
    totalItems: "total_items",
  },
});
