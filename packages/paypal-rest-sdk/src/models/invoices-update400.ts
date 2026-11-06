import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail3Schema, type Detail3 } from "./unions/detail3.js";

export type InvoicesUpdate400 = {
  details?: Detail3[];
};

export const invoicesUpdate400Schema: Schema<InvoicesUpdate400> = s.object<InvoicesUpdate400>({
  details: s.optional(s.array(s.lazy(() => detail3Schema))),
});
