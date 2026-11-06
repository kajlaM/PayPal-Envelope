import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description55Schema, type Description55 } from "./description55.js";
import { issue66Schema, type Issue66 } from "./issue66.js";

export type InvalidInvoiceType = {
  issue?: Issue66;
  description?: Description55;
};

export const invalidInvoiceTypeSchema: Schema<InvalidInvoiceType> = s.object<InvalidInvoiceType>({
  issue: s.optional(s.lazy(() => issue66Schema)),
  description: s.optional(s.lazy(() => description55Schema)),
});
