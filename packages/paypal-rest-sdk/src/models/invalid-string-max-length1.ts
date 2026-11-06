import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description8Schema, type Description8 } from "./description8.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength1 = {
  issue?: Issue4;
  description?: Description8;
};

export const invalidStringMaxLength1Schema: Schema<InvalidStringMaxLength1> =
  s.object<InvalidStringMaxLength1>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description8Schema)),
  });
