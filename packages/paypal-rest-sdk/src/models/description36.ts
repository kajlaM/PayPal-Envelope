import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description36 = {
  EmailAddressLengthShouldBeBetween3And254: "Email address length should be between 3 and 254.",
} as const;
export type Description36 = (typeof Description36)[keyof typeof Description36] | (string & {});

export const description36Schema: EnumSchema<Description36> = s.enumOf<Description36>(Description36);
