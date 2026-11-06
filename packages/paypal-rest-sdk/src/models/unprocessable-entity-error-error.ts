import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name7Schema, type Name7 } from "./name7.js";

/**
 * The requested action cannot be performed and may require interaction with APIs or processes
 * outside of the current request. This is distinct from a 500 response in that there are no
 * systemic problems limiting the API from performing the request.
 */
export type UnprocessableEntityErrorError = {
  name?: Name7;
  message?: string;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const unprocessableEntityErrorErrorSchema: Schema<UnprocessableEntityErrorError> =
  s.object<UnprocessableEntityErrorError>({
    name: s.optional(s.lazy(() => name7Schema)),
    message: s.optional(s.string()),
    details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
