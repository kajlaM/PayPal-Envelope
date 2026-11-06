import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue56Schema, type Issue56 } from "./issue56.js";

export type NotSupported1 = {
  issue?: Issue56;
  description?: string;
};

export const notSupported1Schema: Schema<NotSupported1> = s.object<NotSupported1>({
  issue: s.optional(s.lazy(() => issue56Schema)),
  description: s.optional(s.string()),
});
