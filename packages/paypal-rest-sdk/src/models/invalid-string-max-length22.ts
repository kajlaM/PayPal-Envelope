import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description38Schema, type Description38 } from "./description38.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength22 = {
  issue?: Issue4;
  description?: Description38;
};

export const invalidStringMaxLength22Schema: Schema<InvalidStringMaxLength22> =
  s.object<InvalidStringMaxLength22>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description38Schema)),
  });
