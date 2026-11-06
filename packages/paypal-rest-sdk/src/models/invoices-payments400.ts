import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail5Schema, type Detail5 } from "./unions/detail5.js";

export type InvoicesPayments400 = {
  details?: Detail5[];
};

export const invoicesPayments400Schema: Schema<InvoicesPayments400> = s.object<InvoicesPayments400>({
  details: s.optional(s.array(s.lazy(() => detail5Schema))),
});
