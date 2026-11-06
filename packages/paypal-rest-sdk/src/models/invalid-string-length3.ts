import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength3 = {
  issue?: Issue12;
  description?: string;
};

export const invalidStringLength3Schema: Schema<InvalidStringLength3> = s.object<InvalidStringLength3>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.string()),
});
