import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { authFlowRequiredSchema, type AuthFlowRequired } from "../auth-flow-required.js";
import { userNotFoundSchema, type UserNotFound } from "../user-not-found.js";

export type Detail12 = UserNotFound | AuthFlowRequired;

export const detail12Schema: Schema<Detail12> = s.of<Detail12>(
  s.union([s.lazy(() => userNotFoundSchema), s.lazy(() => authFlowRequiredSchema)]),
);
