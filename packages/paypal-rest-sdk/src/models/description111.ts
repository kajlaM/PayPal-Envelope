import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description111 = {
  TemplateNameAlreadyExists: "Template name already exists.",
} as const;
export type Description111 = (typeof Description111)[keyof typeof Description111] | (string & {});

export const description111Schema: EnumSchema<Description111> = s.enumOf<Description111>(Description111);
