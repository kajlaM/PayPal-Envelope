import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description21Schema, type Description21 } from "./description21.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength8 = {
  issue?: Issue4;
  description?: Description21;
};

export const invalidStringMaxLength8Schema: Schema<InvalidStringMaxLength8> =
  s.object<InvalidStringMaxLength8>({
    issue: s.optional(s.lazy(() => issue4Schema)),
    description: s.optional(s.lazy(() => description21Schema)),
  });
