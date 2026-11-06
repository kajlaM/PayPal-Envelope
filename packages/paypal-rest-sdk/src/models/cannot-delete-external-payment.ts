import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue68Schema, type Issue68 } from "./issue68.js";

export type CannotDeleteExternalPayment = {
  issue?: Issue68;
  description?: string;
};

export const cannotDeleteExternalPaymentSchema: Schema<CannotDeleteExternalPayment> =
  s.object<CannotDeleteExternalPayment>({
    issue: s.optional(s.lazy(() => issue68Schema)),
    description: s.optional(s.string()),
  });
