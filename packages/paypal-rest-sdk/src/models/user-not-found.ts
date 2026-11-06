import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description2Schema, type Description2 } from "./description2.js";
import { issue3Schema, type Issue3 } from "./issue3.js";

export type UserNotFound = {
  issue?: Issue3;
  description?: Description2;
};

export const userNotFoundSchema: Schema<UserNotFound> = s.object<UserNotFound>({
  issue: s.optional(s.lazy(() => issue3Schema)),
  description: s.optional(s.lazy(() => description2Schema)),
});
