import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description34Schema, type Description34 } from "./description34.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength18 = {
  issue?: Issue4;
  description?: Description34;
};

export const invalidStringMaxLength18Schema: Schema<InvalidStringMaxLength18> =
  s.object<InvalidStringMaxLength18>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description34Schema)),
  });
