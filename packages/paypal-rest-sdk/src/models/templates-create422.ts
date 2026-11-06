import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  cannotCancelDraftInvoice1Schema,
  type CannotCancelDraftInvoice1,
} from "./cannot-cancel-draft-invoice1.js";

export type TemplatesCreate422 = {
  details?: CannotCancelDraftInvoice1[];
};

export const templatesCreate422Schema: Schema<TemplatesCreate422> = s.object<TemplatesCreate422>({
  details: s.optional(s.array(s.lazy(() => cannotCancelDraftInvoice1Schema))),
});
