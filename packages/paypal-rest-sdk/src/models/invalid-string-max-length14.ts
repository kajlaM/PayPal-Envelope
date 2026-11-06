import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description29Schema, type Description29 } from "./description29.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength14 = {
  issue?: Issue4;
  description?: Description29;
};

export const invalidStringMaxLength14Schema: Schema<InvalidStringMaxLength14> =
  s.object<InvalidStringMaxLength14>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description29Schema)),
  });
