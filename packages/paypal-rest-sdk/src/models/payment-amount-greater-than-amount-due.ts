import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description54Schema, type Description54 } from "./description54.js";
import { issue65Schema, type Issue65 } from "./issue65.js";

export type PaymentAmountGreaterThanAmountDue = {
  issue?: Issue65;
  description?: Description54;
};

export const paymentAmountGreaterThanAmountDueSchema: Schema<PaymentAmountGreaterThanAmountDue> =
  s.object<PaymentAmountGreaterThanAmountDue>({
    issue: s.optional(s.lazy(() => issue65Schema)),
    description: s.optional(s.lazy(() => description54Schema)),
  });
