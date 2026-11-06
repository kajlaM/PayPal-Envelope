import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail6Schema, type Detail6 } from "./unions/detail6.js";

export type InvoicesPayments422 = {
  details?: Detail6[];
};

export const invoicesPayments422Schema: Schema<InvoicesPayments422> = s.object<InvoicesPayments422>({
  details: s.optional(s.array(s.lazy(() => detail6Schema))),
});
