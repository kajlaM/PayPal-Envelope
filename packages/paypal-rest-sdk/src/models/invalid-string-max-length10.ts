import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description24Schema, type Description24 } from "./description24.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength10 = {
  issue?: Issue4;
  description?: Description24;
};

export const invalidStringMaxLength10Schema: Schema<InvalidStringMaxLength10> =
  s.object<InvalidStringMaxLength10>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description24Schema)),
  });
