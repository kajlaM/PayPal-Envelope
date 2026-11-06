import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail10Schema, type Detail10 } from "./unions/detail10.js";

export type InvoicesSearchInvoices400 = {
  details?: Detail10[];
};

export const invoicesSearchInvoices400Schema: Schema<InvoicesSearchInvoices400> =
  s.object<InvoicesSearchInvoices400>({
    details: s.optional(s.array(s.lazy(() => detail10Schema))),
  });
