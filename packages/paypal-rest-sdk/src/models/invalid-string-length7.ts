import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description30Schema, type Description30 } from "./description30.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength7 = {
  issue?: Issue12;
  description?: Description30;
};

export const invalidStringLength7Schema: Schema<InvalidStringLength7> = s.object<InvalidStringLength7>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description30Schema)),
});
