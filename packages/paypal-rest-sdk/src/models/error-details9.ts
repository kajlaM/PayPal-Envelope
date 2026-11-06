import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description128Schema, type Description128 } from "./description128.js";
import { ErrorLocation, errorLocationSchema } from "./error-location.js";
import { issue158Schema, type Issue158 } from "./issue158.js";

/** The error details. Required for client-side `4XX` errors. */
export type ErrorDetails9 = {
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
  issue?: Issue158;
  /**
   * The human-readable description for an issue. The description can change over the lifetime of an
   * API, so clients must not depend on this value.
   */
  description?: Description128;
};

export const errorDetails9Schema: Schema<ErrorDetails9> = s.object<ErrorDetails9>({
  field: s.optional(s.string()),
  value: s.optional(s.string()),
  location: s.defaulted(errorLocationSchema, ErrorLocation.Body),
  issue: s.optional(s.lazy(() => issue158Schema)),
  description: s.optional(s.lazy(() => description128Schema)),
});
