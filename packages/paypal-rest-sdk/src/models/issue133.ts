import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue133 = {
  AuthFlowRequired: "AUTH_FLOW_REQUIRED",
} as const;
export type Issue133 = (typeof Issue133)[keyof typeof Issue133] | (string & {});

export const issue133Schema: EnumSchema<Issue133> = s.enumOf<Issue133>(Issue133);
