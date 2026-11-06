import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name8WebhooksManagement = {
  ServiceUnavailable: "SERVICE_UNAVAILABLE",
} as const;
export type Name8WebhooksManagement =
  | (typeof Name8WebhooksManagement)[keyof typeof Name8WebhooksManagement]
  | (string & {});

export const name8WebhooksManagementSchema: EnumSchema<Name8WebhooksManagement> =
  s.enumOf<Name8WebhooksManagement>(Name8WebhooksManagement);
