import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { message1Schema, type Message1 } from "./message1.js";
import { name4Schema, type Name4 } from "./name4.js";

/**
 * The server has not found anything matching the request URI. This either means that the URI is
 * incorrect or the resource is not available.
 */
export type NotFoundError = {
  name?: Name4;
  message?: Message1;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const notFoundErrorSchema: Schema<NotFoundError> = s.object<NotFoundError>({
  name: s.optional(s.lazy(() => name4Schema)),
  message: s.optional(s.lazy(() => message1Schema)),
  details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
  debugId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
  _keysMap: {
    debugId: "debug_id",
  },
});
