import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The HTTP method required to make the related call. */
export const Method1WebhooksManagement = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
  Patch: "PATCH",
} as const;
export type Method1WebhooksManagement =
  | (typeof Method1WebhooksManagement)[keyof typeof Method1WebhooksManagement]
  | (string & {});

export const method1WebhooksManagementSchema: EnumSchema<Method1WebhooksManagement> =
  s.enumOf<Method1WebhooksManagement>(Method1WebhooksManagement);
