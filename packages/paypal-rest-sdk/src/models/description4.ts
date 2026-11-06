import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description4 = {
  CannotCancelAPaidOrPartiallyPaidInvoice: "Cannot cancel a paid or partially paid invoice.",
} as const;
export type Description4 = (typeof Description4)[keyof typeof Description4] | (string & {});

export const description4Schema: EnumSchema<Description4> = s.enumOf<Description4>(Description4);
