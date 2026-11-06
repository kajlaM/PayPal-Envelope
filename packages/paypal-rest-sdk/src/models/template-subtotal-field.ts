import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The field names in the template for discount, shipping, and custom amounts. */
export const TemplateSubtotalField = {
  Discount: "DISCOUNT",
  Shipping: "SHIPPING",
  Custom: "CUSTOM",
} as const;
export type TemplateSubtotalField =
  | (typeof TemplateSubtotalField)[keyof typeof TemplateSubtotalField]
  | (string & {});

export const templateSubtotalFieldSchema: EnumSchema<TemplateSubtotalField> =
  s.enumOf<TemplateSubtotalField>(TemplateSubtotalField);
