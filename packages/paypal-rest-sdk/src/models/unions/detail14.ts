import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import {
  cannotDeleteGlobalTemplateSchema,
  type CannotDeleteGlobalTemplate,
} from "../cannot-delete-global-template.js";
import { permissionDeniedSchema, type PermissionDenied } from "../permission-denied.js";

export type Detail14 = PermissionDenied | CannotDeleteGlobalTemplate;

export const detail14Schema: Schema<Detail14> = s.of<Detail14>(
  s.union([s.lazy(() => permissionDeniedSchema), s.lazy(() => cannotDeleteGlobalTemplateSchema)]),
);
