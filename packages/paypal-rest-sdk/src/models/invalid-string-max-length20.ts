import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description37Schema, type Description37 } from "./description37.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength20 = {
  issue?: Issue4;
  description?: Description37;
};

export const invalidStringMaxLength20Schema: Schema<InvalidStringMaxLength20> =
  s.object<InvalidStringMaxLength20>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description37Schema)),
  });
