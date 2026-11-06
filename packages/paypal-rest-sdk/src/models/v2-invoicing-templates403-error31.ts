import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetails31Schema, type ErrorDetails31 } from "./error-details31.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { messageSchema, type Message } from "./message.js";
import { name3Schema, type Name3 } from "./name3.js";

export type V2InvoicingTemplates403Error31 = {
  name?: Name3;
  message?: Message;
  details?: ErrorDetails31[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const v2InvoicingTemplates403Error31Schema: Schema<V2InvoicingTemplates403Error31> =
  s.object<V2InvoicingTemplates403Error31>({
    name: s.optional(s.lazy(() => name3Schema)),
    message: s.optional(s.lazy(() => messageSchema)),
    details: s.optional(s.array(s.lazy(() => errorDetails31Schema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
