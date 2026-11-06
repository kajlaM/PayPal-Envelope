import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name6 = {
  UnsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
} as const;
export type Name6 = (typeof Name6)[keyof typeof Name6] | (string & {});

export const name6Schema: EnumSchema<Name6> = s.enumOf<Name6>(Name6);
