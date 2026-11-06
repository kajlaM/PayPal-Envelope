import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description63Schema, type Description63 } from "./description63.js";
import { issue80Schema, type Issue80 } from "./issue80.js";

export type InvalidRefundAmount = {
  issue?: Issue80;
  description?: Description63;
};

export const invalidRefundAmountSchema: Schema<InvalidRefundAmount> = s.object<InvalidRefundAmount>({
  issue: s.optional(s.lazy(() => issue80Schema)),
  description: s.optional(s.lazy(() => description63Schema)),
});
