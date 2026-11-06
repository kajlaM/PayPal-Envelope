import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description18Schema, type Description18 } from "./description18.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength4 = {
  issue?: Issue12;
  description?: Description18;
};

export const invalidStringLength4Schema: Schema<InvalidStringLength4> = s.object<InvalidStringLength4>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description18Schema)),
});
