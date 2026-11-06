import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const AnchorType = {
  Application: "APPLICATION",
  Account: "ACCOUNT",
} as const;
export type AnchorType = (typeof AnchorType)[keyof typeof AnchorType] | (string & {});

export const anchorTypeSchema: EnumSchema<AnchorType> = s.enumOf<AnchorType>(AnchorType);
