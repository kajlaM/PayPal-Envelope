import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail2Schema, type Detail2 } from "./unions/detail2.js";

export type InvoicesCancel422 = {
  details?: Detail2[];
};

export const invoicesCancel422Schema: Schema<InvoicesCancel422> = s.object<InvoicesCancel422>({
  details: s.optional(s.array(s.lazy(() => detail2Schema))),
});
