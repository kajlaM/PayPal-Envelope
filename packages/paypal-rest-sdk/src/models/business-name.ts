import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The business name of the party. */
export type BusinessName = {
  /** Required. The business name of the party. */
  businessName?: string;
};

export const businessNameSchema: Schema<BusinessName> = s.object<BusinessName>({
  businessName: s.optional(s.string()),
  _keysMap: {
    businessName: "business_name",
  },
});
