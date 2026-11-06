import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description15Schema, type Description15 } from "./description15.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength5 = {
  issue?: Issue4;
  description?: Description15;
};

export const invalidStringMaxLength5Schema: Schema<InvalidStringMaxLength5> =
  s.object<InvalidStringMaxLength5>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description15Schema)),
  });
