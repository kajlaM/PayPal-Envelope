import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails26Schema, type ErrorDetails26 } from "./error-details26.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name1Schema, type Name1 } from "./name1.js";

export type V2InvoicingTemplates400Error21 = {
  name?: Name1;
  message?: string;
  details?: ErrorDetails26[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingTemplates400Error21Schema: Schema<V2InvoicingTemplates400Error21> =
  s.object<V2InvoicingTemplates400Error21>({
    name: s.optional(s.lazy(() => name1Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails26Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
