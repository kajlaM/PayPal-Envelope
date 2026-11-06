import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description3Schema, type Description3 } from "./description3.js";
import { issue6Schema, type Issue6 } from "./issue6.js";

export type CannotCancelDraftInvoice = {
  issue?: Issue6;
  description?: Description3;
};

export const cannotCancelDraftInvoiceSchema: Schema<CannotCancelDraftInvoice> =
  s.object<CannotCancelDraftInvoice>({
    issue: s.optional(s.lazy(() => issue6Schema)),
    description: s.optional(s.lazy(() => description3Schema)),
  });
