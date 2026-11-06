import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The HTTP method required to make the related call. */
export const Method1 = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
  Head: "HEAD",
  Connect: "CONNECT",
  Options: "OPTIONS",
  Patch: "PATCH",
} as const;
export type Method1 = (typeof Method1)[keyof typeof Method1] | (string & {});

export const method1Schema: EnumSchema<Method1> = s.enumOf<Method1>(Method1);
