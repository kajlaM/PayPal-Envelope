import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue6 = {
  CannotCancelDraftInvoice: "CANNOT_CANCEL_DRAFT_INVOICE",
} as const;
export type Issue6 = (typeof Issue6)[keyof typeof Issue6] | (string & {});

export const issue6Schema: EnumSchema<Issue6> = s.enumOf<Issue6>(Issue6);
