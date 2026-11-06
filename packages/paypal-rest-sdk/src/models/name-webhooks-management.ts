import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const NameWebhooksManagement = {
  InvalidRequest: "INVALID_REQUEST",
} as const;
export type NameWebhooksManagement =
  | (typeof NameWebhooksManagement)[keyof typeof NameWebhooksManagement]
  | (string & {});

export const nameWebhooksManagementSchema: EnumSchema<NameWebhooksManagement> =
  s.enumOf<NameWebhooksManagement>(NameWebhooksManagement);
