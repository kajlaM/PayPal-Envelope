import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { name5Schema, type Name5 } from "./name5.js";

/** The server has detected a conflict while processing this request. */
export type ResourceConflictError = {
  name?: Name5;
  message?: string;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const resourceConflictErrorSchema: Schema<ResourceConflictError> = s.object<ResourceConflictError>({
  name: s.optional(s.lazy(() => name5Schema)),
  message: s.optional(s.string()),
  details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
  debugId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
  _keysMap: {
    debugId: "debug_id",
  },
});
