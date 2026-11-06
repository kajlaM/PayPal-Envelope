import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax10 = {
  issue?: Issue14;
  description?: string;
};

export const invalidParameterSyntax10Schema: Schema<InvalidParameterSyntax10> =
  s.object<InvalidParameterSyntax10>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.string()),
  });
