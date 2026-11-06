import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue2Schema, type Issue2 } from "./issue2.js";

export type PermissionDenied = {
  issue?: Issue2;
  description?: string;
};

export const permissionDeniedSchema: Schema<PermissionDenied> = s.object<PermissionDenied>({
  issue: s.optional(s.lazy(() => issue2Schema)),
  description: s.optional(s.string()),
});
