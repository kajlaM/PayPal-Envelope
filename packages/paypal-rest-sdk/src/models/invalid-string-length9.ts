import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description39Schema, type Description39 } from "./description39.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength9 = {
  issue?: Issue12;
  description?: Description39;
};

export const invalidStringLength9Schema: Schema<InvalidStringLength9> = s.object<InvalidStringLength9>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description39Schema)),
});
