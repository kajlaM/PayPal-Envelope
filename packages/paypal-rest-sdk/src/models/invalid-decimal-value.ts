import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue62Schema, type Issue62 } from "./issue62.js";

export type InvalidDecimalValue = {
  issue?: Issue62;
  description?: string;
};

export const invalidDecimalValueSchema: Schema<InvalidDecimalValue> = s.object<InvalidDecimalValue>({
  issue: s.optional(s.lazy(() => issue62Schema)),
  description: s.optional(s.string()),
});
