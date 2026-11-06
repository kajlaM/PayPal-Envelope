import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue158 = {
  CannotCancelDraftInvoice: "CANNOT_CANCEL_DRAFT_INVOICE",
} as const;
export type Issue158 = (typeof Issue158)[keyof typeof Issue158] | (string & {});

export const issue158Schema: EnumSchema<Issue158> = s.enumOf<Issue158>(Issue158);
