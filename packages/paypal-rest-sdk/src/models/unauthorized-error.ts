import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name2Schema, type Name2 } from "./name2.js";

/**
 * Authentication failed due to missing Authorization header, or invalid authentication credentials.
 */
export type UnauthorizedError = {
  name?: Name2;
  message?: string;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const unauthorizedErrorSchema: Schema<UnauthorizedError> = s.object<UnauthorizedError>({
  name: s.optional(s.lazy(() => name2Schema)),
  message: s.optional(s.string()),
  details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
  debugId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
  _keysMap: {
    debugId: "debug_id",
  },
});
