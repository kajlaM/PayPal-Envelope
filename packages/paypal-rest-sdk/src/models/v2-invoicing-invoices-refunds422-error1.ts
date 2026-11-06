import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails17Schema, type ErrorDetails17 } from "./error-details17.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name7Schema, type Name7 } from "./name7.js";

export type V2InvoicingInvoicesRefunds422Error1 = {
  name?: Name7;
  message?: string;
  details?: ErrorDetails17[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingInvoicesRefunds422Error1Schema: Schema<V2InvoicingInvoicesRefunds422Error1> =
  s.object<V2InvoicingInvoicesRefunds422Error1>({
    name: s.optional(s.lazy(() => name7Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails17Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
