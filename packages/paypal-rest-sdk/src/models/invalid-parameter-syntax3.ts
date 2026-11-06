import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description39Schema, type Description39 } from "./description39.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax3 = {
  issue?: Issue14;
  description?: Description39;
};

export const invalidParameterSyntax3Schema: Schema<InvalidParameterSyntax3> =
  s.object<InvalidParameterSyntax3>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description39Schema)),
  });
