import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description32Schema, type Description32 } from "./description32.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength16 = {
  issue?: Issue4;
  description?: Description32;
};

export const invalidStringMaxLength16Schema: Schema<InvalidStringMaxLength16> =
  s.object<InvalidStringMaxLength16>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description32Schema)),
  });
