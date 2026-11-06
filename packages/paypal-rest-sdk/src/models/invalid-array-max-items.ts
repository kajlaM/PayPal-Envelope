import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue5Schema, type Issue5 } from "./issue5.js";

export type InvalidArrayMaxItems = {
  issue?: Issue5;
  description?: string;
};

export const invalidArrayMaxItemsSchema: Schema<InvalidArrayMaxItems> = s.object<InvalidArrayMaxItems>({
  issue: s.optional(s.lazy(() => issue5Schema)),
  description: s.optional(s.string()),
});
