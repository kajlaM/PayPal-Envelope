import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The type of webhook error that occurred. */
export type ErrorType = {
  /** The ID for the webhook error type. */
  id?: string;
  /** The unique error type name. */
  name?: string;
  /** A human-readable description of the error type. */
  description?: string;
};

export const errorTypeSchema: Schema<ErrorType> = s.object<ErrorType>({
  id: s.optional(s.string()),
  name: s.optional(s.string()),
  description: s.optional(s.string()),
});
