import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  templateDisplayPreferenceSchema,
  type TemplateDisplayPreference,
} from "./template-display-preference.js";
import { templateItemFieldSchema, type TemplateItemField } from "./template-item-field.js";

/** The template item setting. Sets a template as the default template or edit template. */
export type TemplateItemSetting = {
  /** The field names for the invoice line items in the template. */
  fieldName?: TemplateItemField;
  /** The template display preference. */
  displayPreference?: TemplateDisplayPreference;
};

export const templateItemSettingSchema: Schema<TemplateItemSetting> = s.object<TemplateItemSetting>({
  fieldName: s.optional(s.lazy(() => templateItemFieldSchema)),
  displayPreference: s.optional(s.lazy(() => templateDisplayPreferenceSchema)),
  _keysMap: {
    fieldName: "field_name",
    displayPreference: "display_preference",
  },
});
