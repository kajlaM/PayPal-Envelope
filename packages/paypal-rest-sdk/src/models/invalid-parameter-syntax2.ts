import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description35Schema, type Description35 } from "./description35.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax2 = {
  issue?: Issue14;
  description?: Description35;
};

export const invalidParameterSyntax2Schema: Schema<InvalidParameterSyntax2> =
  s.object<InvalidParameterSyntax2>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description35Schema)),
  });
