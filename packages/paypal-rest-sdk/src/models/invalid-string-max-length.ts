import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { issue4Schema, type Issue4 } from "./issue4.js";

export type InvalidStringMaxLength = {
  issue?: Issue4;
  description?: string;
};

export const invalidStringMaxLengthSchema: Schema<InvalidStringMaxLength> = s.object<InvalidStringMaxLength>({
  issue: s.optional(s.lazy(() => issue4Schema)),
  description: s.optional(s.string()),
});
