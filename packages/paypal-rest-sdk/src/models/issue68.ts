import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue68 = {
  CannotDeleteExternalPayment: "CANNOT_DELETE_EXTERNAL_PAYMENT",
} as const;
export type Issue68 = (typeof Issue68)[keyof typeof Issue68] | (string & {});

export const issue68Schema: EnumSchema<Issue68> = s.enumOf<Issue68>(Issue68);
