import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description6 = {
  CannotCancelAScheduledInvoice: "Cannot cancel a scheduled invoice.",
} as const;
export type Description6 = (typeof Description6)[keyof typeof Description6] | (string & {});

export const description6Schema: EnumSchema<Description6> = s.enumOf<Description6>(Description6);
