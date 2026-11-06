import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Message3 = {
  ServiceUnavailable: "Service Unavailable.",
} as const;
export type Message3 = (typeof Message3)[keyof typeof Message3] | (string & {});

export const message3Schema: EnumSchema<Message3> = s.enumOf<Message3>(Message3);
