import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description5 = {
  CannotCancelARefundedOrPartiallyRefundedInvoice: "Cannot cancel a refunded or partially refunded invoice.",
} as const;
export type Description5 = (typeof Description5)[keyof typeof Description5] | (string & {});

export const description5Schema: EnumSchema<Description5> = s.enumOf<Description5>(Description5);
