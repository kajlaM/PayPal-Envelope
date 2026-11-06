import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description137Schema, type Description137 } from "./description137.js";
import { ErrorLocation, errorLocationSchema } from "./error-location.js";
import { issue175Schema, type Issue175 } from "./issue175.js";

/** The error details. Required for client-side `4XX` errors. */
export type ErrorDetails26 = {
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
  issue?: Issue175;
  /**
   * The human-readable description for an issue. The description can change over the lifetime of an
   * API, so clients must not depend on this value.
   */
  description?: Description137;
};

export const errorDetails26Schema: Schema<ErrorDetails26> = s.object<ErrorDetails26>({
  field: s.optional(s.string()),
  value: s.optional(s.string()),
  location: s.defaulted(errorLocationSchema, ErrorLocation.Body),
  issue: s.optional(s.lazy(() => issue175Schema)),
  description: s.optional(s.lazy(() => description137Schema)),
});
