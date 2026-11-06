import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail8Schema, type Detail8 } from "./unions/detail8.js";

export type InvoicesRefunds422 = {
  details?: Detail8[];
};

export const invoicesRefunds422Schema: Schema<InvoicesRefunds422> = s.object<InvoicesRefunds422>({
  details: s.optional(s.array(s.lazy(() => detail8Schema))),
});
