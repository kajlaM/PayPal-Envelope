import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name7WebhooksManagement = {
  InternalServerError: "INTERNAL_SERVER_ERROR",
} as const;
export type Name7WebhooksManagement =
  | (typeof Name7WebhooksManagement)[keyof typeof Name7WebhooksManagement]
  | (string & {});

export const name7WebhooksManagementSchema: EnumSchema<Name7WebhooksManagement> =
  s.enumOf<Name7WebhooksManagement>(Name7WebhooksManagement);
