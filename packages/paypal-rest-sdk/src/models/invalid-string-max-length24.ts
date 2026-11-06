import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description43Schema, type Description43 } from "./description43.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength24 = {
  issue?: Issue4;
  description?: Description43;
};

export const invalidStringMaxLength24Schema: Schema<InvalidStringMaxLength24> =
  s.object<InvalidStringMaxLength24>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description43Schema)),
  });
