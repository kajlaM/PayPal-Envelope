import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description22Schema, type Description22 } from "./description22.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength6 = {
  issue?: Issue12;
  description?: Description22;
};

export const invalidStringLength6Schema: Schema<InvalidStringLength6> = s.object<InvalidStringLength6>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description22Schema)),
});
