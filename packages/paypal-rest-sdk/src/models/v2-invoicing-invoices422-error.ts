import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails2Schema, type ErrorDetails2 } from "./error-details2.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name7Schema, type Name7 } from "./name7.js";

export type V2InvoicingInvoices422Error = {
  name?: Name7;
  message?: string;
  details?: ErrorDetails2[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingInvoices422ErrorSchema: Schema<V2InvoicingInvoices422Error> =
  s.object<V2InvoicingInvoices422Error>({
    name: s.optional(s.lazy(() => name7Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails2Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
