import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description57Schema, type Description57 } from "./description57.js";
import { issue14Schema, type Issue14 } from "./issue14.js";

export type InvalidParameterSyntax8 = {
  issue?: Issue14;
  description?: Description57;
};

export const invalidParameterSyntax8Schema: Schema<InvalidParameterSyntax8> =
  s.object<InvalidParameterSyntax8>({
    issue: s.optional(s.lazy(() => issue14Schema)),
    description: s.optional(s.lazy(() => description57Schema)),
  });
