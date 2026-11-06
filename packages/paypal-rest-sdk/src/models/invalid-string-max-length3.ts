import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description12Schema, type Description12 } from "./description12.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength3 = {
  issue?: Issue4;
  description?: Description12;
};

export const invalidStringMaxLength3Schema: Schema<InvalidStringMaxLength3> =
  s.object<InvalidStringMaxLength3>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description12Schema)),
  });
