import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { descriptionSchema, type Description } from "./description.js";
import { issueSchema, type Issue } from "./issue.js";

export type InvalidIntegerMaxValue = {
  issue?: Issue;
  description?: Description;
};

export const invalidIntegerMaxValueSchema: Schema<InvalidIntegerMaxValue> = s.object<InvalidIntegerMaxValue>({
  issue: s.optional(s.lazy(() => issueSchema)),
  description: s.optional(s.lazy(() => descriptionSchema)),
});
