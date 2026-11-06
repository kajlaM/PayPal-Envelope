import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail9Schema, type Detail9 } from "./unions/detail9.js";

export type InvoicesRemind400 = {
  details?: Detail9[];
};

export const invoicesRemind400Schema: Schema<InvoicesRemind400> = s.object<InvoicesRemind400>({
  details: s.optional(s.array(s.lazy(() => detail9Schema))),
});
