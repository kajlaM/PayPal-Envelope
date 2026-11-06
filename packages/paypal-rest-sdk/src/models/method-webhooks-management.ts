import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The HTTP method required to make the related call. */
export const MethodWebhooksManagement = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
  Head: "HEAD",
  Connect: "CONNECT",
  Options: "OPTIONS",
  Patch: "PATCH",
} as const;
export type MethodWebhooksManagement =
  | (typeof MethodWebhooksManagement)[keyof typeof MethodWebhooksManagement]
  | (string & {});

export const methodWebhooksManagementSchema: EnumSchema<MethodWebhooksManagement> =
  s.enumOf<MethodWebhooksManagement>(MethodWebhooksManagement);
