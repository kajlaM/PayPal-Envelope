import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue54Schema, type Issue54 } from "./issue54.js";

export type MissingRequiredParameter = {
  issue?: Issue54;
  description?: string;
};

export const missingRequiredParameterSchema: Schema<MissingRequiredParameter> =
  s.object<MissingRequiredParameter>({
    issue: s.optional(s.lazy(() => issue54Schema)),
    description: s.optional(s.string()),
  });
