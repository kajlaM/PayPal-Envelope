import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description22 = {
  AttachmentIdLengthShouldBeBetween1And255: "Attachment id length should be between 1 and 255.",
} as const;
export type Description22 = (typeof Description22)[keyof typeof Description22] | (string & {});

export const description22Schema: EnumSchema<Description22> = s.enumOf<Description22>(Description22);
