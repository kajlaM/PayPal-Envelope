import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue84Schema, type Issue84 } from "./issue84.js";

export type CannotRemindInvoice = {
  issue?: Issue84;
  description?: string;
};

export const cannotRemindInvoiceSchema: Schema<CannotRemindInvoice> = s.object<CannotRemindInvoice>({
  issue: s.optional(s.lazy(() => issue84Schema)),
  description: s.optional(s.string()),
});
