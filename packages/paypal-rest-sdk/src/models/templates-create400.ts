import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail13Schema, type Detail13 } from "./unions/detail13.js";

export type TemplatesCreate400 = {
  details?: Detail13[];
};

export const templatesCreate400Schema: Schema<TemplatesCreate400> = s.object<TemplatesCreate400>({
  details: s.optional(s.array(s.lazy(() => detail13Schema))),
});
