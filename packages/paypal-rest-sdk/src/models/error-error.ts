import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  errorDetailsWebhooksManagementSchema,
  type ErrorDetailsWebhooksManagement,
} from "./error-details-webhooks-management.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";

/** The error details. */
export type ErrorError = {
  /** The human-readable, unique name of the error. */
  name?: string;
  /** The message that describes the error. */
  message?: string;
  /** The PayPal internal ID. Used for correlation purposes. */
  debugId?: string;
  /**
   * The information link, or URI, that shows detailed information about this error for the
   * developer.
   */
  informationLink?: string;
  /** An array of additional details about the error. */
  details?: ErrorDetailsWebhooksManagement[];
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescriptionWebhooksManagement[];
};

export const errorErrorSchema: Schema<ErrorError> = s.object<ErrorError>({
  name: s.optional(s.string()),
  message: s.optional(s.string()),
  debugId: s.optional(s.string()),
  informationLink: s.optional(s.string()),
  details: s.optional(s.array(s.lazy(() => errorDetailsWebhooksManagementSchema))),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    debugId: "debug_id",
    informationLink: "information_link",
  },
});
