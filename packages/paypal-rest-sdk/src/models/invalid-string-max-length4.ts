import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description13Schema, type Description13 } from "./description13.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength4 = {
  issue?: Issue4;
  description?: Description13;
};

export const invalidStringMaxLength4Schema: Schema<InvalidStringMaxLength4> =
  s.object<InvalidStringMaxLength4>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description13Schema)),
  });
