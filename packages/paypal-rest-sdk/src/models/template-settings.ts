import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { templateItemSettingSchema, type TemplateItemSetting } from "./template-item-setting.js";
import { templateSubtotalSettingSchema, type TemplateSubtotalSetting } from "./template-subtotal-setting.js";

/** The template settings. Sets a template as the default template or edit template. */
export type TemplateSettings = {
  /** The template item headers display preference. */
  templateItemSettings?: TemplateItemSetting[];
  /** The template subtotal headers display preference. */
  templateSubtotalSettings?: TemplateSubtotalSetting[];
};

export const templateSettingsSchema: Schema<TemplateSettings> = s.object<TemplateSettings>({
  templateItemSettings: s.optional(s.array(s.lazy(() => templateItemSettingSchema))),
  templateSubtotalSettings: s.optional(s.array(s.lazy(() => templateSubtotalSettingSchema))),
  _keysMap: {
    templateItemSettings: "template_item_settings",
    templateSubtotalSettings: "template_subtotal_settings",
  },
});
