import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description57Schema, type Description57 } from "./description57.js";
import { issue70Schema, type Issue70 } from "./issue70.js";

export type InvalidRefundMethod = {
  issue?: Issue70;
  description?: Description57;
};

export const invalidRefundMethodSchema: Schema<InvalidRefundMethod> = s.object<InvalidRefundMethod>({
  issue: s.optional(s.lazy(() => issue70Schema)),
  description: s.optional(s.lazy(() => description57Schema)),
});
