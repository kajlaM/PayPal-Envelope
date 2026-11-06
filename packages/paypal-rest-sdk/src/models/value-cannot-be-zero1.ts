import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description62Schema, type Description62 } from "./description62.js";
import { issue61Schema, type Issue61 } from "./issue61.js";

export type ValueCannotBeZero1 = {
  issue?: Issue61;
  description?: Description62;
};

export const valueCannotBeZero1Schema: Schema<ValueCannotBeZero1> = s.object<ValueCannotBeZero1>({
  issue: s.optional(s.lazy(() => issue61Schema)),
  description: s.optional(s.lazy(() => description62Schema)),
});
