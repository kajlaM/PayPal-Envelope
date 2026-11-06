import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { linkDescription1Schema, type LinkDescription1 } from "./link-description1.js";
import { templateInformationSchema, type TemplateInformation } from "./template-information.js";
import { templateSettingsSchema, type TemplateSettings } from "./template-settings.js";
import { unitOfMeasureSchema, type UnitOfMeasure } from "./unit-of-measure.js";

/** The template with invoice details to load with all captured fields. */
export type Template = {
  /** The ID of the template. */
  id?: string;
  /**
   * The template name.<blockquote><strong>Note:</strong> The template name must be
   * unique.</blockquote>
   */
  name?: string;
  /**
   * Indicates whether this template is the default template. A invoicer can have one default
   * template.
   */
  defaultTemplate?: boolean;
  /**
   * The template details. Includes invoicer business information, invoice recipients, items, and
   * configuration.
   */
  templateInfo?: TemplateInformation;
  /** The template settings. Sets a template as the default template or edit template. */
  settings?: TemplateSettings;
  /** The unit of measure for the invoiced item. */
  unitOfMeasure?: UnitOfMeasure;
  /**
   * Indicates whether this template is a invoicer-created custom template. The system generates
   * non-custom templates.
   */
  standardTemplate?: boolean;
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescription1[];
};

export const templateSchema: Schema<Template> = s.object<Template>({
  id: s.optional(s.string()),
  name: s.optional(s.string()),
  defaultTemplate: s.optional(s.boolean()),
  templateInfo: s.optional(s.lazy(() => templateInformationSchema)),
  settings: s.optional(s.lazy(() => templateSettingsSchema)),
  unitOfMeasure: s.optional(s.lazy(() => unitOfMeasureSchema)),
  standardTemplate: s.optional(s.boolean()),
  links: s.optional(s.array(s.lazy(() => linkDescription1Schema))),
  _keysMap: {
    defaultTemplate: "default_template",
    templateInfo: "template_info",
    unitOfMeasure: "unit_of_measure",
    standardTemplate: "standard_template",
  },
});
