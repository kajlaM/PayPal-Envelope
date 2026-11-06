import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { permissionDeniedSchema, type PermissionDenied } from "./permission-denied.js";

export type TemplatesGet403 = {
  details?: PermissionDenied[];
};

export const templatesGet403Schema: Schema<TemplatesGet403> = s.object<TemplatesGet403>({
  details: s.optional(s.array(s.lazy(() => permissionDeniedSchema))),
});
