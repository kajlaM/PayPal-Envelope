import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description14Schema, type Description14 } from "./description14.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength1 = {
  issue?: Issue12;
  description?: Description14;
};

export const invalidStringLength1Schema: Schema<InvalidStringLength1> = s.object<InvalidStringLength1>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description14Schema)),
});
