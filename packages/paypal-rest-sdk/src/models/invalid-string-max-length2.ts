import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description10Schema, type Description10 } from "./description10.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength2 = {
  issue?: Issue4;
  description?: Description10;
};

export const invalidStringMaxLength2Schema: Schema<InvalidStringMaxLength2> =
  s.object<InvalidStringMaxLength2>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description10Schema)),
  });
