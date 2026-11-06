import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description9Schema, type Description9 } from "./description9.js";
import { issue12Schema, type Issue12 } from "./issue12.js";

export type InvalidStringLength = {
  issue?: Issue12;
  description?: Description9;
};

export const invalidStringLengthSchema: Schema<InvalidStringLength> = s.object<InvalidStringLength>({
  issue: s.optional(s.lazy(() => issue12Schema)),
  description: s.optional(s.lazy(() => description9Schema)),
});
