import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description20Schema, type Description20 } from "./description20.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength7 = {
  issue?: Issue4;
  description?: Description20;
};

export const invalidStringMaxLength7Schema: Schema<InvalidStringMaxLength7> =
  s.object<InvalidStringMaxLength7>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description20Schema)),
  });
