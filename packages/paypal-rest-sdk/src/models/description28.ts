import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description28 = {
  MemoLengthShouldBeLessThan4000Characters: "Memo length should be less than 4000 characters.",
} as const;
export type Description28 = (typeof Description28)[keyof typeof Description28] | (string & {});

export const description28Schema: EnumSchema<Description28> = s.enumOf<Description28>(Description28);
