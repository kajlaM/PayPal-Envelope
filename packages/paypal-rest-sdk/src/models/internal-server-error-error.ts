import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { message2Schema, type Message2 } from "./message2.js";
import { name8Schema, type Name8 } from "./name8.js";

/**
 * This is either a system or application error, and generally indicates that although the client
 * appeared to provide a correct request, something unexpected has gone wrong on the server.
 */
export type InternalServerErrorError = {
  name?: Name8;
  message?: Message2;
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const internalServerErrorErrorSchema: Schema<InternalServerErrorError> =
  s.object<InternalServerErrorError>({
    name: s.optional(s.lazy(() => name8Schema)),
    message: s.optional(s.lazy(() => message2Schema)),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
