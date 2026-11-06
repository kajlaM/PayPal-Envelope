import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description31Schema, type Description31 } from "./description31.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength15 = {
  issue?: Issue4;
  description?: Description31;
};

export const invalidStringMaxLength15Schema: Schema<InvalidStringMaxLength15> =
  s.object<InvalidStringMaxLength15>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description31Schema)),
  });
