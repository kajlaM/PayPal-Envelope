import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description52Schema, type Description52 } from "./description52.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax6 = {
  issue?: Issue14;
  description?: Description52;
};

export const invalidParameterSyntax6Schema: Schema<InvalidParameterSyntax6> =
  s.object<InvalidParameterSyntax6>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description52Schema)),
  });
