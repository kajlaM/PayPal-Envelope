import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { userNotFoundSchema, type UserNotFound } from "./user-not-found.js";

export type M422 = {
  details?: UserNotFound[];
};

export const m422Schema: Schema<M422> = s.object<M422>({
  details: s.optional(s.array(s.lazy(() => userNotFoundSchema))),
});
