import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description63 = {
  RecordedRefundsCannotExceedRecordedPayments: "Recorded refunds cannot exceed recorded payments.",
} as const;
export type Description63 = (typeof Description63)[keyof typeof Description63] | (string & {});

export const description63Schema: EnumSchema<Description63> = s.enumOf<Description63>(Description63);
