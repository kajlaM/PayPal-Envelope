import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description49Schema, type Description49 } from "./description49.js";
import { issue56Schema, type Issue56 } from "./issue56.js";

export type NotSupported = {
  issue?: Issue56;
  description?: Description49;
};

export const notSupportedSchema: Schema<NotSupported> = s.object<NotSupported>({
  issue: s.optional(s.lazy(() => issue56Schema)),
  description: s.optional(s.lazy(() => description49Schema)),
});
