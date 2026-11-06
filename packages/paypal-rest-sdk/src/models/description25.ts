import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description25 = {
  WebsiteUrlLengthShouldBeLessThan2048Characters: "Website url length should be less than 2048 characters.",
} as const;
export type Description25 = (typeof Description25)[keyof typeof Description25] | (string & {});

export const description25Schema: EnumSchema<Description25> = s.enumOf<Description25>(Description25);
