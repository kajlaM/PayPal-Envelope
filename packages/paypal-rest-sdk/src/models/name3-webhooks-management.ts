import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name3WebhooksManagement = {
  ResourceNotFound: "RESOURCE_NOT_FOUND",
} as const;
export type Name3WebhooksManagement =
  | (typeof Name3WebhooksManagement)[keyof typeof Name3WebhooksManagement]
  | (string & {});

export const name3WebhooksManagementSchema: EnumSchema<Name3WebhooksManagement> =
  s.enumOf<Name3WebhooksManagement>(Name3WebhooksManagement);
