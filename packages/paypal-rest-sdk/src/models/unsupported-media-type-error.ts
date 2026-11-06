import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name6Schema, type Name6 } from "./name6.js";

/** The server does not support the request payload's media type. */
export type UnsupportedMediaTypeError = {
  name?: Name6;
  message?: string;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const unsupportedMediaTypeErrorSchema: Schema<UnsupportedMediaTypeError> =
  s.object<UnsupportedMediaTypeError>({
    name: s.optional(s.lazy(() => name6Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
