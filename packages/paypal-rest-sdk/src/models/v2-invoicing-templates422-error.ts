import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails27Schema, type ErrorDetails27 } from "./error-details27.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name7Schema, type Name7 } from "./name7.js";

export type V2InvoicingTemplates422Error = {
  name?: Name7;
  message?: string;
  details?: ErrorDetails27[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingTemplates422ErrorSchema: Schema<V2InvoicingTemplates422Error> =
  s.object<V2InvoicingTemplates422Error>({
    name: s.optional(s.lazy(() => name7Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetails27Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
