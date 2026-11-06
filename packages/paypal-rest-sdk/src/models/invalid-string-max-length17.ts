import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description33Schema, type Description33 } from "./description33.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength17 = {
  issue?: Issue4;
  description?: Description33;
};

export const invalidStringMaxLength17Schema: Schema<InvalidStringMaxLength17> =
  s.object<InvalidStringMaxLength17>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description33Schema)),
  });
