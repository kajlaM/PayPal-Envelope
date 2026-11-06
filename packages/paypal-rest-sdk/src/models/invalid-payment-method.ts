import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description48Schema, type Description48 } from "./description48.js";
import { issue55Schema, type Issue55 } from "./issue55.js";

export type InvalidPaymentMethod = {
  issue?: Issue55;
  description?: Description48;
};

export const invalidPaymentMethodSchema: Schema<InvalidPaymentMethod> = s.object<InvalidPaymentMethod>({
  issue: s.optional(s.lazy(() => issue55Schema)),
  description: s.optional(s.lazy(() => description48Schema)),
});
