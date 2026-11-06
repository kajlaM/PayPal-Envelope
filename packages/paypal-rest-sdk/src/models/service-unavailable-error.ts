import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { linkDescriptionSchema, type LinkDescription } from "./link-description.js";
import { message3Schema, type Message3 } from "./message3.js";
import { name9Schema, type Name9 } from "./name9.js";

/**
 * The server is temporarily unable to handle the request, for example, because of planned
 * maintenance or downtime.
 */
export type ServiceUnavailableError = {
  name?: Name9;
  message?: Message3;
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /** An array of request-related [HATEOAS links](https://en.wikipedia.org/wiki/HATEOAS). */
  links?: LinkDescription[];
};

export const serviceUnavailableErrorSchema: Schema<ServiceUnavailableError> =
  s.object<ServiceUnavailableError>({
    name: s.optional(s.lazy(() => name9Schema)),
    message: s.optional(s.lazy(() => message3Schema)),
    debugId: s.optional(s.string()),
    links: s.optional(s.array(s.lazy(() => linkDescriptionSchema))),
    _keysMap: {
      debugId: "debug_id",
    },
  });
