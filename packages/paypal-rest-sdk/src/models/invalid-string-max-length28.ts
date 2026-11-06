import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description65Schema, type Description65 } from "./description65.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength28 = {
  issue?: Issue4;
  description?: Description65;
};

export const invalidStringMaxLength28Schema: Schema<InvalidStringMaxLength28> =
  s.object<InvalidStringMaxLength28>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description65Schema)),
  });
