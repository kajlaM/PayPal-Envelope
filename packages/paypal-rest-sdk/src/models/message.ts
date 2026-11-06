import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Message = {
  AuthorizationFailedDueToInsufficientPermissions: "Authorization failed due to insufficient permissions.",
} as const;
export type Message = (typeof Message)[keyof typeof Message] | (string & {});

export const messageSchema: EnumSchema<Message> = s.enumOf<Message>(Message);
