import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue134 = {
  TemplateNameAlreadyExists: "TEMPLATE_NAME_ALREADY_EXISTS",
} as const;
export type Issue134 = (typeof Issue134)[keyof typeof Issue134] | (string & {});

export const issue134Schema: EnumSchema<Issue134> = s.enumOf<Issue134>(Issue134);
