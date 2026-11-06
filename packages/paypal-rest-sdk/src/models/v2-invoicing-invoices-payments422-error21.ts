import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails14Schema, type ErrorDetails14 } from "./error-details14.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name7Schema, type Name7 } from "./name7.js";

export type V2InvoicingInvoicesPayments422Error21 = {
  name?: Name7;
  message?: string;
  details?: ErrorDetails14[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingInvoicesPayments422Error21Schema: Schema<V2InvoicingInvoicesPayments422Error21> =
  s.object<V2InvoicingInvoicesPayments422Error21>({
    name: s.optional(s.lazy(() => name7Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails14Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
