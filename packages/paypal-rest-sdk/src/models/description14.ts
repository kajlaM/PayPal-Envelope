import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description14 = {
  LanguageIsInvalid: "Language is invalid.",
} as const;
export type Description14 = (typeof Description14)[keyof typeof Description14] | (string & {});

export const description14Schema: EnumSchema<Description14> = s.enumOf<Description14>(Description14);
