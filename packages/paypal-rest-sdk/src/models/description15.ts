import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description15 = {
  AdminArea1LengthShouldBeLessThan300Characters: "Admin area1 length should be less than 300 characters.",
} as const;
export type Description15 = (typeof Description15)[keyof typeof Description15] | (string & {});

export const description15Schema: EnumSchema<Description15> = s.enumOf<Description15>(Description15);
