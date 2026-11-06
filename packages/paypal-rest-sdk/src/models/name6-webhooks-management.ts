import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name6WebhooksManagement = {
  UnprocessableEntity: "UNPROCESSABLE_ENTITY",
} as const;
export type Name6WebhooksManagement =
  | (typeof Name6WebhooksManagement)[keyof typeof Name6WebhooksManagement]
  | (string & {});

export const name6WebhooksManagementSchema: EnumSchema<Name6WebhooksManagement> =
  s.enumOf<Name6WebhooksManagement>(Name6WebhooksManagement);
