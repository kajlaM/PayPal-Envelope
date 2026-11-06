import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description47Schema, type Description47 } from "./description47.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax5 = {
  issue?: Issue14;
  description?: Description47;
};

export const invalidParameterSyntax5Schema: Schema<InvalidParameterSyntax5> =
  s.object<InvalidParameterSyntax5>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description47Schema)),
  });
