import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue9 = {
  CannotCancelScheduledInvoice: "CANNOT_CANCEL_SCHEDULED_INVOICE",
} as const;
export type Issue9 = (typeof Issue9)[keyof typeof Issue9] | (string & {});

export const issue9Schema: EnumSchema<Issue9> = s.enumOf<Issue9>(Issue9);
