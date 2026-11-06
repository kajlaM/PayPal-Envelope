import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail1Schema, type Detail1 } from "./unions/detail1.js";

export type InvoicesCancel400 = {
  details?: Detail1[];
};

export const invoicesCancel400Schema: Schema<InvoicesCancel400> = s.object<InvoicesCancel400>({
  details: s.optional(s.array(s.lazy(() => detail1Schema))),
});
