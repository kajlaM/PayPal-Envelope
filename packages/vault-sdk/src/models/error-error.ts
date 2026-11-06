import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ErrorError = {
  error: string;
  message?: string;
};

export const errorErrorSchema: Schema<ErrorError> = s.object<ErrorError>({
  error: s.string(),
  message: s.optional(s.string()),
});
