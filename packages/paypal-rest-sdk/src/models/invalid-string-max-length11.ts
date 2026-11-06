import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description25Schema, type Description25 } from "./description25.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength11 = {
  issue?: Issue4;
  description?: Description25;
};

export const invalidStringMaxLength11Schema: Schema<InvalidStringMaxLength11> =
  s.object<InvalidStringMaxLength11>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description25Schema)),
  });
