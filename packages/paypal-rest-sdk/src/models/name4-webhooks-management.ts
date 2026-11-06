import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name4WebhooksManagement = {
  ResourceConflict: "RESOURCE_CONFLICT",
} as const;
export type Name4WebhooksManagement =
  | (typeof Name4WebhooksManagement)[keyof typeof Name4WebhooksManagement]
  | (string & {});

export const name4WebhooksManagementSchema: EnumSchema<Name4WebhooksManagement> =
  s.enumOf<Name4WebhooksManagement>(Name4WebhooksManagement);
