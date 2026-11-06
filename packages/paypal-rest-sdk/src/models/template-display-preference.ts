import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The template display preference. */
export type TemplateDisplayPreference = {
  /** Indicates whether to show or hide this field. @default false */
  hidden?: boolean;
};

export const templateDisplayPreferenceSchema: Schema<TemplateDisplayPreference> =
  s.object<TemplateDisplayPreference>({
    hidden: s.defaulted(s.boolean(), false),
  });
