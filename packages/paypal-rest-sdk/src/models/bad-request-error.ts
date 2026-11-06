import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name1Schema, type Name1 } from "./name1.js";

/** Request is not well-formed, syntactically incorrect, or violates schema. */
export type BadRequestError = {
  name?: Name1;
  message?: string;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const badRequestErrorSchema: Schema<BadRequestError> = s.object<BadRequestError>({
  name: s.optional(s.lazy(() => name1Schema)),
  message: s.optional(s.string()),
  details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
  debugId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
  _keysMap: {
    debugId: "debug_id",
  },
});
