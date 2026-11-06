import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue84 = {
  CannotRemindInvoice: "CANNOT_REMIND_INVOICE",
} as const;
export type Issue84 = (typeof Issue84)[keyof typeof Issue84] | (string & {});

export const issue84Schema: EnumSchema<Issue84> = s.enumOf<Issue84>(Issue84);
