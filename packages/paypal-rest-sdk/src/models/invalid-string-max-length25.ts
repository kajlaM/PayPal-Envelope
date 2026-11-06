import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description44Schema, type Description44 } from "./description44.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength25 = {
  issue?: Issue4;
  description?: Description44;
};

export const invalidStringMaxLength25Schema: Schema<InvalidStringMaxLength25> =
  s.object<InvalidStringMaxLength25>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description44Schema)),
  });
