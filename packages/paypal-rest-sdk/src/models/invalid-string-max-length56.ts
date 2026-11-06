import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description115Schema, type Description115 } from "./description115.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength56 = {
  issue?: Issue4;
  description?: Description115;
};

export const invalidStringMaxLength56Schema: Schema<InvalidStringMaxLength56> =
  s.object<InvalidStringMaxLength56>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description115Schema)),
  });
