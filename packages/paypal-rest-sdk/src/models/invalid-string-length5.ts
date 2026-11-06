import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description19Schema, type Description19 } from "./description19.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength5 = {
  issue?: Issue12;
  description?: Description19;
};

export const invalidStringLength5Schema: Schema<InvalidStringLength5> = s.object<InvalidStringLength5>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description19Schema)),
});
