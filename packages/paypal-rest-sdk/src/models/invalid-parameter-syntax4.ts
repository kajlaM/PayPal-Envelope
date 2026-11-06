import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description42Schema, type Description42 } from "./description42.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax4 = {
  issue?: Issue14;
  description?: Description42;
};

export const invalidParameterSyntax4Schema: Schema<InvalidParameterSyntax4> =
  s.object<InvalidParameterSyntax4>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description42Schema)),
  });
