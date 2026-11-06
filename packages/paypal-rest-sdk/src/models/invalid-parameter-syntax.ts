import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description11Schema, type Description11 } from "./description11.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax = {
  issue?: Issue14;
  description?: Description11;
};

export const invalidParameterSyntaxSchema: Schema<InvalidParameterSyntax> = s.object<InvalidParameterSyntax>({
  issue: s.optional(s.lazy(() => issue14Schema)),
  description: s.optional(s.lazy(() => description11Schema)),
});
