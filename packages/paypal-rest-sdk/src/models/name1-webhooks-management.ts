import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name1WebhooksManagement = {
  AuthenticationFailure: "AUTHENTICATION_FAILURE",
} as const;
export type Name1WebhooksManagement =
  | (typeof Name1WebhooksManagement)[keyof typeof Name1WebhooksManagement]
  | (string & {});

export const name1WebhooksManagementSchema: EnumSchema<Name1WebhooksManagement> =
  s.enumOf<Name1WebhooksManagement>(Name1WebhooksManagement);
