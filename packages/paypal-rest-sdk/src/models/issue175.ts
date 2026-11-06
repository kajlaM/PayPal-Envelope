import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue175 = {
  TemplateNameAlreadyExists: "TEMPLATE_NAME_ALREADY_EXISTS",
} as const;
export type Issue175 = (typeof Issue175)[keyof typeof Issue175] | (string & {});

export const issue175Schema: EnumSchema<Issue175> = s.enumOf<Issue175>(Issue175);
