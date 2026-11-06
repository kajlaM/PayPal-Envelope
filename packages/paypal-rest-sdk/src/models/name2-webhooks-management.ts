import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name2WebhooksManagement = {
  NotAuthorized: "NOT_AUTHORIZED",
} as const;
export type Name2WebhooksManagement =
  | (typeof Name2WebhooksManagement)[keyof typeof Name2WebhooksManagement]
  | (string & {});

export const name2WebhooksManagementSchema: EnumSchema<Name2WebhooksManagement> =
  s.enumOf<Name2WebhooksManagement>(Name2WebhooksManagement);
