import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue63Schema, type Issue63 } from "./issue63.js";

export type InvalidIntegerValue = {
  issue?: Issue63;
  description?: string;
};

export const invalidIntegerValueSchema: Schema<InvalidIntegerValue> = s.object<InvalidIntegerValue>({
  issue: s.optional(s.lazy(() => issue63Schema)),
  description: s.optional(s.string()),
});
