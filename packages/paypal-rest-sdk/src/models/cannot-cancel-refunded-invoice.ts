import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description5Schema, type Description5 } from "./description5.js";
import { issue8Schema, type Issue8 } from "./issue8.js";

export type CannotCancelRefundedInvoice = {
  issue?: Issue8;
  description?: Description5;
};

export const cannotCancelRefundedInvoiceSchema: Schema<CannotCancelRefundedInvoice> =
  s.object<CannotCancelRefundedInvoice>({
    issue: s.optional(s.lazy(() => issue8Schema)),
    description: s.optional(s.lazy(() => description5Schema)),
  });
