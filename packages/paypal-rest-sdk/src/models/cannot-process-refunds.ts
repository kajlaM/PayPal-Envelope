import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description64Schema, type Description64 } from "./description64.js";
import { issue81Schema, type Issue81 } from "./issue81.js";

export type CannotProcessRefunds = {
  issue?: Issue81;
  description?: Description64;
};

export const cannotProcessRefundsSchema: Schema<CannotProcessRefunds> = s.object<CannotProcessRefunds>({
  issue: s.optional(s.lazy(() => issue81Schema)),
  description: s.optional(s.lazy(() => description64Schema)),
});
