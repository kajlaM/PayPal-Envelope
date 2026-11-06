import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { ErrorLocation, errorLocationSchema } from "./error-location.js";

/** The error details. Required for client-side `4XX` errors. */
export type ErrorDetails1WebhooksManagement = {
  /**
   * The field that caused the error. If this field is in the body, set this value to the field's
   * JSON pointer value. Required for client-side errors.
   */
  field?: string;
  /** The value of the field that caused the error. */
  value?: string;
  /**
   * The location of the field that caused the error. Value is `body`, `path`, or `query`.
   *
   * @default ErrorLocation.Body
   */
  location?: ErrorLocation;
  /** The unique, fine-grained application-level error code. */
  issue?: string;
  /**
   * The human-readable description for an issue. The description can change over the lifetime of an
   * API, so clients must not depend on this value.
   */
  description?: string;
};

export const errorDetails1WebhooksManagementSchema: Schema<ErrorDetails1WebhooksManagement> =
  s.object<ErrorDetails1WebhooksManagement>({
    field: s.optional(s.string()),
    value: s.optional(s.string()),
    location: s.defaulted(errorLocationSchema, ErrorLocation.Body),
    issue: s.optional(s.string()),
    description: s.optional(s.string()),
  });
