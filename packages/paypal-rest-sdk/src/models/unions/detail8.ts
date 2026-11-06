import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { cannotProcessRefundsSchema, type CannotProcessRefunds } from "../cannot-process-refunds.js";
import { invalidRefundAmountSchema, type InvalidRefundAmount } from "../invalid-refund-amount.js";

export type Detail8 = InvalidRefundAmount | CannotProcessRefunds;

export const detail8Schema: Schema<Detail8> = s.of<Detail8>(
  s.union([s.lazy(() => invalidRefundAmountSchema), s.lazy(() => cannotProcessRefundsSchema)]),
);
