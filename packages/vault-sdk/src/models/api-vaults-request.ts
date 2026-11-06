import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { policySchema, type Policy } from "./policy.js";

export type ApiVaultsRequest = {
  policy: Policy;
  sourceText?: string;
  userId?: string;
};

export const apiVaultsRequestSchema: Schema<ApiVaultsRequest> = s.object<ApiVaultsRequest>({
  policy: policySchema,
  sourceText: s.optional(s.string()),
  userId: s.optional(s.string()),
});
