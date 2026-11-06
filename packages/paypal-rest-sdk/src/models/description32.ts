import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description32 = {
  LogoUrlLengthShouldBeLessThan4000Characters: "Logo url length should be less than 4000 characters.",
} as const;
export type Description32 = (typeof Description32)[keyof typeof Description32] | (string & {});

export const description32Schema: EnumSchema<Description32> = s.enumOf<Description32>(Description32);
