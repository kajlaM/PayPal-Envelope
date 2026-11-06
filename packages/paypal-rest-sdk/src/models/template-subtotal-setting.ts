import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  templateDisplayPreferenceSchema,
  type TemplateDisplayPreference,
} from "./template-display-preference.js";
import { templateSubtotalFieldSchema, type TemplateSubtotalField } from "./template-subtotal-field.js";

/** The template subtotal setting. Includes the field name and display preference. */
export type TemplateSubtotalSetting = {
  /** The field names in the template for discount, shipping, and custom amounts. */
  fieldName?: TemplateSubtotalField;
  /** The template display preference. */
  displayPreference?: TemplateDisplayPreference;
};

export const templateSubtotalSettingSchema: Schema<TemplateSubtotalSetting> =
  s.object<TemplateSubtotalSetting>({
    fieldName: s.optional(s.lazy(() => templateSubtotalFieldSchema)),
    displayPreference: s.optional(s.lazy(() => templateDisplayPreferenceSchema)),
    _keysMap: {
      fieldName: "field_name",
      displayPreference: "display_preference",
    },
  });
