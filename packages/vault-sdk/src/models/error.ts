import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Error = {
  error: string;
  message?: string;
};

export const errorSchema: Schema<Error> = s.object<Error>({
  error: s.string(),
  message: s.optional(s.string()),
});
