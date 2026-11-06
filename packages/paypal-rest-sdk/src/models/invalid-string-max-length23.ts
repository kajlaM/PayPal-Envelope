import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description41Schema, type Description41 } from "./description41.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength23 = {
  issue?: Issue4;
  description?: Description41;
};

export const invalidStringMaxLength23Schema: Schema<InvalidStringMaxLength23> =
  s.object<InvalidStringMaxLength23>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description41Schema)),
  });
