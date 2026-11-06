import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description27Schema, type Description27 } from "./description27.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax1 = {
  issue?: Issue14;
  description?: Description27;
};

export const invalidParameterSyntax1Schema: Schema<InvalidParameterSyntax1> =
  s.object<InvalidParameterSyntax1>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description27Schema)),
  });
