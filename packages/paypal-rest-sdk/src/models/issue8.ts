import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue8 = {
  CannotCancelRefundedInvoice: "CANNOT_CANCEL_REFUNDED_INVOICE",
} as const;
export type Issue8 = (typeof Issue8)[keyof typeof Issue8] | (string & {});

export const issue8Schema: EnumSchema<Issue8> = s.enumOf<Issue8>(Issue8);
