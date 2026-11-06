import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { permissionDeniedSchema, type PermissionDenied } from "./permission-denied.js";

export type M403 = {
  details?: PermissionDenied[];
};

export const m403Schema: Schema<M403> = s.object<M403>({
  details: s.optional(s.array(s.lazy(() => permissionDeniedSchema))),
});
