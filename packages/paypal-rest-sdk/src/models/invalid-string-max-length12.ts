import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description26Schema, type Description26 } from "./description26.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength12 = {
  issue?: Issue4;
  description?: Description26;
};

export const invalidStringMaxLength12Schema: Schema<InvalidStringMaxLength12> =
  s.object<InvalidStringMaxLength12>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description26Schema)),
  });
