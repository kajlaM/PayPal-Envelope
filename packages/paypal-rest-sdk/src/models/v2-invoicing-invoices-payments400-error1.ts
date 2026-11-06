import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails10Schema, type ErrorDetails10 } from "./error-details10.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name1Schema, type Name1 } from "./name1.js";

export type V2InvoicingInvoicesPayments400Error1 = {
  name?: Name1;
  message?: string;
  details?: ErrorDetails10[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingInvoicesPayments400Error1Schema: Schema<V2InvoicingInvoicesPayments400Error1> =
  s.object<V2InvoicingInvoicesPayments400Error1>({
    name: s.optional(s.lazy(() => name1Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails10Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
