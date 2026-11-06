import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description17Schema, type Description17 } from "./description17.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength6 = {
  issue?: Issue4;
  description?: Description17;
};

export const invalidStringMaxLength6Schema: Schema<InvalidStringMaxLength6> =
  s.object<InvalidStringMaxLength6>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description17Schema)),
  });
