import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description1Schema, type Description1 } from "./description1.js";
import { issue1Schema, type Issue1 } from "./issue1.js";

export type InvalidIntegerMinValue = {
  issue?: Issue1;
  description?: Description1;
};

export const invalidIntegerMinValueSchema: Schema<InvalidIntegerMinValue> = s.object<InvalidIntegerMinValue>({
  issue: s.optional(s.lazy(() => issue1Schema)),
  description: s.optional(s.lazy(() => description1Schema)),
});
