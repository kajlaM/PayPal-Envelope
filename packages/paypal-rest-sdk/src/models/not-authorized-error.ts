import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { errorDetailsSchema, type ErrorDetails } from "./error-details.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { messageSchema, type Message } from "./message.js";
import { name3Schema, type Name3 } from "./name3.js";

/** The client is not authorized to access this resource, although it may have valid credentials. */
export type NotAuthorizedError = {
  name?: Name3;
  message?: Message;
  details?: ErrorDetails[];
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const notAuthorizedErrorSchema: Schema<NotAuthorizedError> = s.object<NotAuthorizedError>({
  name: s.optional(s.lazy(() => name3Schema)),
  message: s.optional(s.lazy(() => messageSchema)),
  details: s.optional(s.array(s.lazy(() => errorDetailsSchema))),
  debugId: s.optional(s.string()),
  links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
  _keysMap: {
    debugId: "debug_id",
  },
});
