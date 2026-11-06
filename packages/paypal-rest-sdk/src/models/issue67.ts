import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue67 = {
  CannotProcessPayments: "CANNOT_PROCESS_PAYMENTS",
} as const;
export type Issue67 = (typeof Issue67)[keyof typeof Issue67] | (string & {});

export const issue67Schema: EnumSchema<Issue67> = s.enumOf<Issue67>(Issue67);
