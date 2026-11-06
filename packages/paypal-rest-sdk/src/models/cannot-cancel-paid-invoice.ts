import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description4Schema, type Description4 } from "./description4.js";
import { issue7Schema, type Issue7 } from "./issue7.js";

export type CannotCancelPaidInvoice = {
  issue?: Issue7;
  description?: Description4;
};

export const cannotCancelPaidInvoiceSchema: Schema<CannotCancelPaidInvoice> =
  s.object<CannotCancelPaidInvoice>({
    issue: s.optional(s.lazy(() => issue7Schema)),
    description: s.optional(s.lazy(() => description4Schema)),
  });
