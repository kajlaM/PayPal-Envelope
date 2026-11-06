import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description70Schema, type Description70 } from "./description70.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength12 = {
  issue?: Issue12;
  description?: Description70;
};

export const invalidStringLength12Schema: Schema<InvalidStringLength12> = s.object<InvalidStringLength12>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description70Schema)),
});
