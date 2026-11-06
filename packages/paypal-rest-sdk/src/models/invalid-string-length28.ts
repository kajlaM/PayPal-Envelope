import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description121Schema, type Description121 } from "./description121.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength28 = {
  issue?: Issue12;
  description?: Description121;
};

export const invalidStringLength28Schema: Schema<InvalidStringLength28> = s.object<InvalidStringLength28>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description121Schema)),
});
