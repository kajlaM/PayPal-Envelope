import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description53Schema, type Description53 } from "./description53.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax7 = {
  issue?: Issue14;
  description?: Description53;
};

export const invalidParameterSyntax7Schema: Schema<InvalidParameterSyntax7> =
  s.object<InvalidParameterSyntax7>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description53Schema)),
  });
