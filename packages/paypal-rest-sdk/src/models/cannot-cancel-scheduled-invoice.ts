import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description6Schema, type Description6 } from "./description6.js";
import { issue9Schema, type Issue9 } from "./issue9.js";

export type CannotCancelScheduledInvoice = {
  issue?: Issue9;
  description?: Description6;
};

export const cannotCancelScheduledInvoiceSchema: Schema<CannotCancelScheduledInvoice> =
  s.object<CannotCancelScheduledInvoice>({
    issue: s.optional(s.lazy(() => issue9Schema)),
    description: s.optional(s.lazy(() => description6Schema)),
  });
