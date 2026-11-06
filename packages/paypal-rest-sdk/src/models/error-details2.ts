import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description125Schema, type Description125 } from "./description125.js";
import { ErrorLocation, errorLocationSchema } from "./error-location.js";
import { issue151Schema, type Issue151 } from "./issue151.js";

/** The error details. Required for client-side `4XX` errors. */
export type ErrorDetails2 = {
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
  issue?: Issue151;
  /**
   * The human-readable description for an issue. The description can change over the lifetime of an
   * API, so clients must not depend on this value.
   */
  description?: Description125;
};

export const errorDetails2Schema: Schema<ErrorDetails2> = s.object<ErrorDetails2>({
  field: s.optional(s.string()),
  value: s.optional(s.string()),
  location: s.defaulted(errorLocationSchema, ErrorLocation.Body),
  issue: s.optional(s.lazy(() => issue151Schema)),
  description: s.optional(s.lazy(() => description125Schema)),
});
