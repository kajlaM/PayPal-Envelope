import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail15Schema, type Detail15 } from "./unions/detail15.js";

export type TemplatesUpdate400 = {
  details?: Detail15[];
};

export const templatesUpdate400Schema: Schema<TemplatesUpdate400> = s.object<TemplatesUpdate400>({
  details: s.optional(s.array(s.lazy(() => detail15Schema))),
});
