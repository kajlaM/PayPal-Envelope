import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails1Schema, type ErrorDetails1 } from "./error-details1.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name1Schema, type Name1 } from "./name1.js";

export type V2InvoicingInvoices400Error1 = {
  name?: Name1;
  message?: string;
  details?: ErrorDetails1[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingInvoices400Error1Schema: Schema<V2InvoicingInvoices400Error1> =
  s.object<V2InvoicingInvoices400Error1>({
    name: s.optional(s.lazy(() => name1Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails1Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
