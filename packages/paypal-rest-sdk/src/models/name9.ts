import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Name9 = {
  ServiceUnavailable: "SERVICE_UNAVAILABLE",
} as const;
export type Name9 = (typeof Name9)[keyof typeof Name9] | (string & {});

export const name9Schema: EnumSchema<Name9> = s.enumOf<Name9>(Name9);
