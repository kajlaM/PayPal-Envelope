import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description23Schema, type Description23 } from "./description23.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength9 = {
  issue?: Issue4;
  description?: Description23;
};

export const invalidStringMaxLength9Schema: Schema<InvalidStringMaxLength9> =
  s.object<InvalidStringMaxLength9>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description23Schema)),
  });
