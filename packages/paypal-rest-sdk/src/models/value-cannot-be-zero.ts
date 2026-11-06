import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue61Schema, type Issue61 } from "./issue61.js";

export type ValueCannotBeZero = {
  issue?: Issue61;
  description?: string;
};

export const valueCannotBeZeroSchema: Schema<ValueCannotBeZero> = s.object<ValueCannotBeZero>({
  issue: s.optional(s.lazy(() => issue61Schema)),
  description: s.optional(s.string()),
});
