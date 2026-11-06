import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unique, fine-grained application-level error code. */
export const Issue163 = {
  CannotDeleteExternalPayment: "CANNOT_DELETE_EXTERNAL_PAYMENT",
} as const;
export type Issue163 = (typeof Issue163)[keyof typeof Issue163] | (string & {});

export const issue163Schema: EnumSchema<Issue163> = s.enumOf<Issue163>(Issue163);
