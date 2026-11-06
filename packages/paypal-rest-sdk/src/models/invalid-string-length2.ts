import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description16Schema, type Description16 } from "./description16.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength2 = {
  issue?: Issue12;
  description?: Description16;
};

export const invalidStringLength2Schema: Schema<InvalidStringLength2> = s.object<InvalidStringLength2>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description16Schema)),
});
