import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description116 = {
  CannotCancelADraftInvoice: "Cannot cancel a draft invoice.",
} as const;
export type Description116 = (typeof Description116)[keyof typeof Description116] | (string & {});

export const description116Schema: EnumSchema<Description116> = s.enumOf<Description116>(Description116);
