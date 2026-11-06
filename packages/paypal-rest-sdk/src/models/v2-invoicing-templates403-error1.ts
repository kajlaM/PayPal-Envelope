import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails5Schema, type ErrorDetails5 } from "./error-details5.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { messageSchema, type Message } from "./message.js";
import { name3Schema, type Name3 } from "./name3.js";

export type V2InvoicingTemplates403Error1 = {
  name?: Name3;
  message?: Message;
  details?: ErrorDetails5[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingTemplates403Error1Schema: Schema<V2InvoicingTemplates403Error1> =
  s.object<V2InvoicingTemplates403Error1>({
    name: s.optional(s.lazy(() => name3Schema)),
    message: s.optional(s.lazy(() => messageSchema)),
    details: s.optional(s.array(s.lazy(() => errorDetails5Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
