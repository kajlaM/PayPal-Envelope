import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description69Schema, type Description69 } from "./description69.js";
import { issue5Schema, type Issue5 } from "./issue5.js";

export type InvalidArrayMaxItems2 = {
  issue?: Issue5;
  description?: Description69;
};

export const invalidArrayMaxItems2Schema: Schema<InvalidArrayMaxItems2> = s.object<InvalidArrayMaxItems2>({
  issue: s.optional(s.lazy(() => issue5Schema)),
  description: s.optional(s.lazy(() => description69Schema)),
});
