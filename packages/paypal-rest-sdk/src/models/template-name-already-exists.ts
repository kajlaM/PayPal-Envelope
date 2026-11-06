import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description111Schema, type Description111 } from "./description111.js";
import { issue134Schema, type Issue134 } from "./issue134.js";

export type TemplateNameAlreadyExists = {
  issue?: Issue134;
  description?: Description111;
};

export const templateNameAlreadyExistsSchema: Schema<TemplateNameAlreadyExists> =
  s.object<TemplateNameAlreadyExists>({
    issue: s.optional(s.lazy(() => issue134Schema)),
    description: s.optional(s.lazy(() => description111Schema)),
  });
