import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The location of the field that caused the error. Value is `body`, `path`, or `query`. */
export const ErrorLocation = {
  Body: "body",
  Path: "path",
  Query: "query",
} as const;
export type ErrorLocation = (typeof ErrorLocation)[keyof typeof ErrorLocation] | (string & {});

export const errorLocationSchema: EnumSchema<ErrorLocation> = s.enumOf<ErrorLocation>(ErrorLocation);
