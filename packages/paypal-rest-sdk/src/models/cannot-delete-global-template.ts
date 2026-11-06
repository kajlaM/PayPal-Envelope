import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description117Schema, type Description117 } from "./description117.js";
import { issue142Schema, type Issue142 } from "./issue142.js";

export type CannotDeleteGlobalTemplate = {
  issue?: Issue142;
  description?: Description117;
};

export const cannotDeleteGlobalTemplateSchema: Schema<CannotDeleteGlobalTemplate> =
  s.object<CannotDeleteGlobalTemplate>({
    issue: s.optional(s.lazy(() => issue142Schema)),
    description: s.optional(s.lazy(() => description117Schema)),
  });
