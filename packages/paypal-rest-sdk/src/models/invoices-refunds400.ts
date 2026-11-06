import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail7Schema, type Detail7 } from "./unions/detail7.js";

export type InvoicesRefunds400 = {
  details?: Detail7[];
};

export const invoicesRefunds400Schema: Schema<InvoicesRefunds400> = s.object<InvoicesRefunds400>({
  details: s.optional(s.array(s.lazy(() => detail7Schema))),
});
