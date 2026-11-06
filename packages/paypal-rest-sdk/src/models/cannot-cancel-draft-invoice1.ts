import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description116Schema, type Description116 } from "./description116.js";
import { issue6Schema, type Issue6 } from "./issue6.js";

export type CannotCancelDraftInvoice1 = {
  issue?: Issue6;
  description?: Description116;
};

export const cannotCancelDraftInvoice1Schema: Schema<CannotCancelDraftInvoice1> =
  s.object<CannotCancelDraftInvoice1>({
    issue: s.optional(s.lazy(() => issue6Schema)),
    description: s.optional(s.lazy(() => description116Schema)),
  });
