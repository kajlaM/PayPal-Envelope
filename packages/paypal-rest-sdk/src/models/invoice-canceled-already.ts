import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description7Schema, type Description7 } from "./description7.js";
import { issue10Schema, type Issue10 } from "./issue10.js";

export type InvoiceCanceledAlready = {
  issue?: Issue10;
  description?: Description7;
};

export const invoiceCanceledAlreadySchema: Schema<InvoiceCanceledAlready> = s.object<InvoiceCanceledAlready>({
  issue: s.optional(s.lazy(() => issue10Schema)),
  description: s.optional(s.lazy(() => description7Schema)),
});
