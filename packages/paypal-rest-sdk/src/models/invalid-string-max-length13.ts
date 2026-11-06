import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description28Schema, type Description28 } from "./description28.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength13 = {
  issue?: Issue4;
  description?: Description28;
};

export const invalidStringMaxLength13Schema: Schema<InvalidStringMaxLength13> =
  s.object<InvalidStringMaxLength13>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description28Schema)),
  });
