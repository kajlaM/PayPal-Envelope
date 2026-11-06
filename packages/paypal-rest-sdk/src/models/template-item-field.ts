import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The field names for the invoice line items in the template. */
export const TemplateItemField = {
  ItemsQuantity: "ITEMS_QUANTITY",
  ItemsDescription: "ITEMS_DESCRIPTION",
  ItemsDate: "ITEMS_DATE",
  ItemsDiscount: "ITEMS_DISCOUNT",
  ItemsTax: "ITEMS_TAX",
} as const;
export type TemplateItemField = (typeof TemplateItemField)[keyof typeof TemplateItemField] | (string & {});

export const templateItemFieldSchema: EnumSchema<TemplateItemField> =
  s.enumOf<TemplateItemField>(TemplateItemField);
