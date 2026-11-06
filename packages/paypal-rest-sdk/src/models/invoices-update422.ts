import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail12Schema, type Detail12 } from "./unions/detail12.js";

export type InvoicesUpdate422 = {
  details?: Detail12[];
};

export const invoicesUpdate422Schema: Schema<InvoicesUpdate422> = s.object<InvoicesUpdate422>({
  details: s.optional(s.array(s.lazy(() => detail12Schema))),
});
