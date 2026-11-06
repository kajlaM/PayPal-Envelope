import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description112Schema, type Description112 } from "./description112.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength23 = {
  issue?: Issue12;
  description?: Description112;
};

export const invalidStringLength23Schema: Schema<InvalidStringLength23> = s.object<InvalidStringLength23>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description112Schema)),
});
