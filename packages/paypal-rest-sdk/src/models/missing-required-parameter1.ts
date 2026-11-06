import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description51Schema, type Description51 } from "./description51.js";
import { issue54Schema, type Issue54 } from "./issue54.js";

export type MissingRequiredParameter1 = {
  issue?: Issue54;
  description?: Description51;
};

export const missingRequiredParameter1Schema: Schema<MissingRequiredParameter1> =
  s.object<MissingRequiredParameter1>({
    issue: s.optional(s.lazy(() => issue54Schema)),
    description: s.optional(s.lazy(() => description51Schema)),
  });
