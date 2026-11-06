import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Message1 = {
  TheSpecifiedResourceDoesNotExist: "The specified resource does not exist.",
} as const;
export type Message1 = (typeof Message1)[keyof typeof Message1] | (string & {});

export const message1Schema: EnumSchema<Message1> = s.enumOf<Message1>(Message1);
