import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Message2 = {
  AnInternalServerErrorOccurred: "An internal server error occurred.",
} as const;
export type Message2 = (typeof Message2)[keyof typeof Message2] | (string & {});

export const message2Schema: EnumSchema<Message2> = s.enumOf<Message2>(Message2);
