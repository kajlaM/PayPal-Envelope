import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description36Schema, type Description36 } from "./description36.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength8 = {
  issue?: Issue12;
  description?: Description36;
};

export const invalidStringLength8Schema: Schema<InvalidStringLength8> = s.object<InvalidStringLength8>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description36Schema)),
});
