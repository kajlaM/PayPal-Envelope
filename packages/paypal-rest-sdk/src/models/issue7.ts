import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue7 = {
  CannotCancelPaidInvoice: "CANNOT_CANCEL_PAID_INVOICE",
} as const;
export type Issue7 = (typeof Issue7)[keyof typeof Issue7] | (string & {});

export const issue7Schema: EnumSchema<Issue7> = s.enumOf<Issue7>(Issue7);
