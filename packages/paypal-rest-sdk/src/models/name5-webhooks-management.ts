import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name5WebhooksManagement = {
  UnsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
} as const;
export type Name5WebhooksManagement =
  | (typeof Name5WebhooksManagement)[keyof typeof Name5WebhooksManagement]
  | (string & {});

export const name5WebhooksManagementSchema: EnumSchema<Name5WebhooksManagement> =
  s.enumOf<Name5WebhooksManagement>(Name5WebhooksManagement);
