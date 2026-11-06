import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description56Schema, type Description56 } from "./description56.js";
import { issue67Schema, type Issue67 } from "./issue67.js";

export type CannotProcessPayments = {
  issue?: Issue67;
  description?: Description56;
};

export const cannotProcessPaymentsSchema: Schema<CannotProcessPayments> = s.object<CannotProcessPayments>({
  issue: s.optional(s.lazy(() => issue67Schema)),
  description: s.optional(s.lazy(() => description56Schema)),
});
