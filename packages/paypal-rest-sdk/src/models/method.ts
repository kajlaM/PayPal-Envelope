import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The HTTP method required to make the related call. */
export const Method = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
  Patch: "PATCH",
} as const;
export type Method = (typeof Method)[keyof typeof Method] | (string & {});

export const methodSchema: EnumSchema<Method> = s.enumOf<Method>(Method);
