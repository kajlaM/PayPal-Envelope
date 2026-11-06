import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description53 = {
  DateShouldBeOfFormatYyyyMmDd: "Date should be of format yyyy-mm-dd.",
} as const;
export type Description53 = (typeof Description53)[keyof typeof Description53] | (string & {});

export const description53Schema: EnumSchema<Description53> = s.enumOf<Description53>(Description53);
