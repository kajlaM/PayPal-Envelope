import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail3Schema, type Detail3 } from "./unions/detail3.js";

export type InvoicesCreate400 = {
  details?: Detail3[];
};

export const invoicesCreate400Schema: Schema<InvoicesCreate400> = s.object<InvoicesCreate400>({
  details: s.optional(s.array(s.lazy(() => detail3Schema))),
});
