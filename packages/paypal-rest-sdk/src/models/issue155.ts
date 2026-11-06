import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue155 = {
  CannotRemindInvoice: "CANNOT_REMIND_INVOICE",
} as const;
export type Issue155 = (typeof Issue155)[keyof typeof Issue155] | (string & {});

export const issue155Schema: EnumSchema<Issue155> = s.enumOf<Issue155>(Issue155);
