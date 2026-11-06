import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail14Schema, type Detail14 } from "./unions/detail14.js";

export type TemplatesDelete403 = {
  details?: Detail14[];
};

export const templatesDelete403Schema: Schema<TemplatesDelete403> = s.object<TemplatesDelete403>({
  details: s.optional(s.array(s.lazy(() => detail14Schema))),
});
